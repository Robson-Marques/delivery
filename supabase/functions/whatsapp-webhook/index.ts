import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Read WhatsApp config from DB, fallback to env vars
  const { data: waConfig } = await supabase.from("whatsapp_config").select("*").limit(1).single();
  const WA_TOKEN = waConfig?.access_token || Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const WA_PHONE_ID = waConfig?.phone_number_id || Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const WA_VERIFY_TOKEN = waConfig?.verify_token || Deno.env.get("WHATSAPP_VERIFY_TOKEN");

  // ====== WEBHOOK VERIFICATION (GET) ======
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === WA_VERIFY_TOKEN) {
      console.log("Webhook verified!");
      return new Response(challenge, { status: 200, headers: corsHeaders });
    }
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  // ====== INCOMING MESSAGES (POST) ======
  try {
    const body = await req.json();

    // Meta sends a specific structure
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // Check if it's a message (not a status update)
    if (!value?.messages?.[0]) {
      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const msg = value.messages[0];
    const from = msg.from; // phone number
    const messageText = msg.text?.body || "";
    const waMessageId = msg.id;
    const contactName = value.contacts?.[0]?.profile?.name || from;

    if (!messageText.trim()) {
      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save incoming message
    await supabase.from("whatsapp_messages").insert({
      phone: from,
      direction: "incoming",
      message: messageText,
      wa_message_id: waMessageId,
    });

    // Fetch conversation history (last 20 messages)
    const { data: history } = await supabase
      .from("whatsapp_messages")
      .select("*")
      .eq("phone", from)
      .order("created_at", { ascending: false })
      .limit(20);

    const conversationHistory = (history || []).reverse().map((m: any) => ({
      role: m.direction === "incoming" ? "user" : "assistant",
      content: m.message,
    }));

    // Fetch menu data for AI context
    const { data: categories } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    const { data: products } = await supabase.from("products").select("*").eq("is_active", true).order("sort_order");

    const { data: settings } = await supabase.from("establishment_settings").select("*").limit(1).single();

    const { data: neighborhoods } = await supabase.from("neighborhoods").select("*").eq("is_active", true);

    const { data: pizzaSizes } = await supabase.from("pizza_sizes").select("*").order("sort_order");

    // Build menu context
    const menuText = (categories || [])
      .map((cat: any) => {
        const catProducts = (products || []).filter((p: any) => p.category_id === cat.id);
        if (catProducts.length === 0) return "";
        const items = catProducts
          .map((p: any) => {
            const price = p.promo_price ? `~R$${p.price}~ R$${p.promo_price}` : `R$${Number(p.price).toFixed(2)}`;
            const desc = p.description ? ` - ${p.description}` : "";
            const pizza = p.is_pizza ? " 🍕 (permite 2 sabores)" : "";
            return `  • ${p.name}${desc} → ${price}${pizza}`;
          })
          .join("\n");
        return `*${cat.icon || ""} ${cat.name}*\n${items}`;
      })
      .filter(Boolean)
      .join("\n\n");

    const sizesText = (pizzaSizes || [])
      .map((s: any) => `  • ${s.label} (${s.slices} fatias) - multiplicador ${s.price_multiplier}x`)
      .join("\n");

    const neighborhoodsText = (neighborhoods || [])
      .map((n: any) => `  • ${n.name}: R$${Number(n.delivery_fee).toFixed(2)}`)
      .join("\n");

    // Check existing customer
    const { data: customer } = await supabase.from("customers").select("*").eq("phone", from).maybeSingle();

    const customerInfo = customer
      ? `Cliente cadastrado: ${customer.name}, ${customer.total_orders} pedidos, ${customer.loyalty_points} pontos de fidelidade. Endereço: ${customer.address || "não cadastrado"} ${customer.address_number || ""} ${customer.neighborhood || ""}`
      : "Cliente novo (não cadastrado).";

    // Check recent orders
    const { data: recentOrders } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_phone", from)
      .order("created_at", { ascending: false })
      .limit(3);

    const ordersInfo = (recentOrders || [])
      .map((o: any) => `Pedido #${o.order_number}: ${o.status} - R$${Number(o.total).toFixed(2)} (${o.order_type})`)
      .join("\n");

    const isOpen = (() => {
      if (settings?.is_open === false) return false;

      const hours =
        typeof settings?.opening_hours === "string" ? JSON.parse(settings.opening_hours) : settings?.opening_hours;

      if (!hours || !hours.auto_toggle) return settings?.is_open ?? false;

      const dayMap: Record<number, string> = {
        0: "sun",
        1: "mon",
        2: "tue",
        3: "wed",
        4: "thu",
        5: "fri",
        6: "sat",
      };

      // Converte para Brasília manualmente (UTC-3) sem depender de toLocaleString
      const now = new Date();
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
      const brasiliaMs = utcMs - 3 * 60 * 60000; // UTC-3
      const nowBrasilia = new Date(brasiliaMs);

      const currentDay = dayMap[nowBrasilia.getUTCDay()];
      const currentTime = nowBrasilia.getUTCHours() * 60 + nowBrasilia.getUTCMinutes();

      console.log(
        `[HORÁRIO] Brasília: ${nowBrasilia.getUTCHours()}:${String(nowBrasilia.getUTCMinutes()).padStart(2, "0")} | Dia: ${currentDay} | Minutos: ${currentTime}`,
      );

      const todayHours = hours?.[currentDay];
      if (!todayHours || !todayHours.enabled) return false;

      const [openH, openM] = todayHours.open.split(":").map(Number);
      const [closeH, closeM] = todayHours.close.split(":").map(Number);
      const openTime = openH * 60 + openM;
      const closeTime = closeH * 60 + closeM;

      console.log(
        `[HORÁRIO] Abertura: ${openTime} | Fechamento: ${closeTime} | Atual: ${currentTime} | Aberto: ${currentTime >= openTime && currentTime < closeTime}`,
      );

      return currentTime >= openTime && currentTime < closeTime;
    })();
    // LOGS TEMPORÁRIOS - remova depois de resolver
    console.log("=== DEBUG HORÁRIO ===");
    console.log("is_open no banco:", settings?.is_open);
    console.log("opening_hours:", JSON.stringify(settings?.opening_hours));
    console.log("isOpen calculado:", isOpen);

    const now = new Date();
    const nowBrasilia = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    console.log("Hora Brasília:", nowBrasilia.toISOString());
    console.log("Dia semana:", nowBrasilia.getDay());
    console.log("====================");

    const systemPrompt = `Você é o assistente virtual do ${settings?.name || "nosso restaurante"} no WhatsApp. Responda de forma amigável, concisa e em português brasileiro.

INFORMAÇÕES DO ESTABELECIMENTO:
- Nome: ${settings?.name || "Pizza Express"}
- Telefone: ${settings?.phone || ""}
- Status: ${isOpen ? "ABERTO" : "FECHADO"}

CARDÁPIO:
${menuText || "Cardápio não disponível no momento."}

TAMANHOS DE PIZZA:
${sizesText || "Não disponível"}

BAIRROS E TAXAS DE ENTREGA:
${neighborhoodsText || "Consultar"}

INFORMAÇÃO DO CLIENTE:
${customerInfo}

PEDIDOS RECENTES:
${ordersInfo || "Nenhum pedido recente."}

INSTRUÇÕES:
1. Se o cliente pedir o cardápio, envie formatado com emojis e preços.
2. Se o cliente quiser fazer um pedido, colete: itens, tamanho (se pizza), endereço de entrega, forma de pagamento (pix, dinheiro, cartão).
3. Se o estabelecimento estiver FECHADO, informe educadamente e mostre os horários.
4. Para consulta de status, use os pedidos recentes do cliente.
5. Se o cliente perguntar sobre pontos de fidelidade, informe o saldo (10 pontos = R$1 desconto).
6. Quando o pedido estiver completo com todos os dados, responda com um JSON no final da mensagem no formato:
   ===ORDER_JSON===
   {"action":"create_order","customer_name":"...","customer_phone":"...","items":[{"product_name":"...","quantity":1,"unit_price":0.00,"size":"..."}],"order_type":"delivery","delivery_address":"...","delivery_number":"...","delivery_neighborhood":"...","payment_method":"pix","observations":"..."}
   ===END_ORDER===
7. Formate mensagens para WhatsApp: use *negrito*, _itálico_, e emojis.
8. Respostas curtas e objetivas. Máx 3-4 parágrafos.`;

    // Call AI
    let aiResponse = "Desculpe, estou com dificuldades. Tente novamente em instantes.";

    if (LOVABLE_API_KEY) {
      try {
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: systemPrompt },
              ...conversationHistory,
              { role: "user", content: messageText },
            ],
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          aiResponse = aiData.choices?.[0]?.message?.content || aiResponse;
        } else {
          console.error("AI error:", aiRes.status, await aiRes.text());
        }
      } catch (e) {
        console.error("AI call failed:", e);
      }
    }

    // Check if AI response contains an order JSON
    const orderMatch = aiResponse.match(/===ORDER_JSON===\s*([\s\S]*?)\s*===END_ORDER===/);
    if (orderMatch) {
      try {
        const orderData = JSON.parse(orderMatch[1].trim());
        if (orderData.action === "create_order") {
          // Find or create customer
          let customerId = customer?.id;
          if (!customerId) {
            const { data: newCust } = await supabase
              .from("customers")
              .insert({
                name: orderData.customer_name || contactName,
                phone: from,
                address: orderData.delivery_address || null,
                address_number: orderData.delivery_number || null,
                neighborhood: orderData.delivery_neighborhood || null,
              })
              .select()
              .single();
            customerId = newCust?.id;
          }

          // Calculate totals
          const subtotal = orderData.items.reduce((s: number, i: any) => s + i.unit_price * i.quantity, 0);
          const deliveryNeighborhood = (neighborhoods || []).find(
            (n: any) => n.name.toLowerCase() === (orderData.delivery_neighborhood || "").toLowerCase(),
          );
          const deliveryFee =
            orderData.order_type === "delivery"
              ? deliveryNeighborhood?.delivery_fee || settings?.default_delivery_fee || 5.99
              : 0;
          const total = subtotal + Number(deliveryFee);

          const { data: order } = await supabase
            .from("orders")
            .insert({
              customer_id: customerId,
              customer_name: orderData.customer_name || contactName,
              customer_phone: from,
              order_type: orderData.order_type || "delivery",
              payment_method: orderData.payment_method || "pix",
              delivery_address: orderData.delivery_address || null,
              delivery_number: orderData.delivery_number || null,
              delivery_neighborhood: orderData.delivery_neighborhood || null,
              subtotal,
              delivery_fee: deliveryFee,
              discount: 0,
              total,
              observations: orderData.observations || `Pedido via WhatsApp`,
            })
            .select()
            .single();

          if (order) {
            const items = orderData.items.map((i: any) => ({
              order_id: order.id,
              product_name: i.product_name,
              quantity: i.quantity || 1,
              unit_price: i.unit_price,
              size: i.size || null,
            }));
            await supabase.from("order_items").insert(items);
          }

          // Clean the JSON from the response
          aiResponse = aiResponse.replace(/===ORDER_JSON===[\s\S]*?===END_ORDER===/, "").trim();
          if (order) {
            aiResponse += `\n\n✅ *Pedido #${order.order_number} registrado!*\nTotal: R$${Number(total).toFixed(2)}`;
          }
        }
      } catch (e) {
        console.error("Order parsing failed:", e);
      }
    }

    // Send reply via WhatsApp API
    if (WA_TOKEN && WA_PHONE_ID) {
      try {
        const waRes = await fetch(`https://graph.facebook.com/v21.0/${WA_PHONE_ID}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WA_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: from,
            type: "text",
            text: { body: aiResponse },
          }),
        });
        if (!waRes.ok) {
          console.error("WhatsApp send error:", waRes.status, await waRes.text());
        }
      } catch (e) {
        console.error("WhatsApp send failed:", e);
      }
    }

    // Save outgoing message
    await supabase.from("whatsapp_messages").insert({
      phone: from,
      direction: "outgoing",
      message: aiResponse,
    });

    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 200, // Meta expects 200 to not retry
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

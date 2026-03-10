import { useState, useEffect } from 'react';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';
import { ArrowLeft, MapPin, CreditCard, Banknote, QrCode, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { createOrder, createOrderItems, findOrCreateCustomer } from '@/lib/api';
import { LoyaltyRedeem } from '@/components/checkout/LoyaltyRedeem';
import { toast } from 'sonner';

type OrderType = 'delivery' | 'pickup' | 'dine_in';
type PaymentMethod = 'pix' | 'cash' | 'card' | 'online';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, discount, deliveryFee, total, clearCart, coupon, loyaltyPointsUsed, loyaltyDiscount } = useCart();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [complement, setComplement] = useState('');
  const [reference, setReference] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [payment, setPayment] = useState<PaymentMethod>('pix');
  const [changeFor, setChangeFor] = useState('');
  const [observations, setObservations] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const formatPrice = (p: number) => p.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const actualDeliveryFee = orderType === 'delivery' ? deliveryFee : 0;
  const actualTotal = Math.max(0, subtotal - discount + actualDeliveryFee);

  const orderTypes: { id: OrderType; label: string; icon: string }[] = [
    { id: 'delivery', label: 'Entrega', icon: '🛵' },
    { id: 'pickup', label: 'Retirada', icon: '🏪' },
    { id: 'dine_in', label: 'No local', icon: '🍽️' },
  ];

  const paymentMethods: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { id: 'pix', label: 'PIX', icon: <QrCode className="w-4 h-4" /> },
    { id: 'cash', label: 'Dinheiro', icon: <Banknote className="w-4 h-4" /> },
    { id: 'card', label: 'Cartão', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'online', label: 'Online', icon: <Smartphone className="w-4 h-4" /> },
  ];

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error('Preencha nome e telefone');
      return;
    }
    if (orderType === 'delivery' && (!address.trim() || !neighborhood.trim())) {
      toast.error('Preencha o endereço completo');
      return;
    }
    if (items.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }

    setSubmitting(true);
    try {
      // Find or create customer
      const customer = await findOrCreateCustomer({
        name, phone, address, address_number: addressNumber,
        neighborhood, complement, reference,
      });

      // Create order
      const order = await createOrder({
        customer_id: customer.id,
        customer_name: name,
        customer_phone: phone,
        delivery_address: orderType === 'delivery' ? address : undefined,
        delivery_number: orderType === 'delivery' ? addressNumber : undefined,
        delivery_neighborhood: orderType === 'delivery' ? neighborhood : undefined,
        delivery_complement: orderType === 'delivery' ? complement : undefined,
        delivery_reference: orderType === 'delivery' ? reference : undefined,
        order_type: orderType,
        payment_method: payment,
        change_for: payment === 'cash' && changeFor ? parseFloat(changeFor) : undefined,
        subtotal,
        delivery_fee: actualDeliveryFee,
        discount,
        total: actualTotal,
        observations,
        coupon_code: coupon?.code,
      });

      // Create order items
      await createOrderItems(items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        size: item.size,
        second_flavor_id: item.secondFlavorId,
        second_flavor_name: item.secondFlavorName,
        extras: item.extras as unknown as import('@/integrations/supabase/types').Json,
        observations: item.observations,
      })));

      clearCart();
      toast.success(`Pedido #${order.order_number} realizado com sucesso!`);
      navigate('/order-confirmation/' + order.id);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao criar pedido. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-4xl mb-4">🛒</p>
        <p className="text-muted-foreground mb-4">Carrinho vazio</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Ver cardápio</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="container flex items-center gap-3 h-14 px-4">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-heading font-bold text-foreground">Finalizar Pedido</h1>
        </div>
      </header>

      <div className="container px-4 py-4 space-y-5 max-w-lg mx-auto">
        <section>
          <h2 className="font-heading font-semibold text-sm text-foreground mb-2">Tipo do pedido</h2>
          <div className="grid grid-cols-3 gap-2">
            {orderTypes.map(t => (
              <button key={t.id} onClick={() => setOrderType(t.id)}
                className={`p-3 rounded-lg border text-center transition-all ${orderType === t.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                <span className="text-xl block">{t.icon}</span>
                <span className="text-xs font-medium text-foreground">{t.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-sm text-foreground mb-2">Seus dados</h2>
          <div className="space-y-2">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo *" className="w-full p-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefone (WhatsApp) *" className="w-full p-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
          </div>
        </section>

        {orderType === 'delivery' && (
          <section>
            <h2 className="font-heading font-semibold text-sm text-foreground mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary" /> Endereço de entrega
            </h2>
            <div className="space-y-2">
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua / Avenida *" className="w-full p-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
              <div className="grid grid-cols-2 gap-2">
                <input value={addressNumber} onChange={e => setAddressNumber(e.target.value)} placeholder="Número" className="w-full p-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
                <input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Bairro *" className="w-full p-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
              </div>
              <input value={complement} onChange={e => setComplement(e.target.value)} placeholder="Complemento" className="w-full p-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
              <input value={reference} onChange={e => setReference(e.target.value)} placeholder="Referência" className="w-full p-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
            </div>
          </section>
        )}

        <section>
          <h2 className="font-heading font-semibold text-sm text-foreground mb-2">Pagamento</h2>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map(m => (
              <button key={m.id} onClick={() => setPayment(m.id)}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm transition-all ${payment === m.id ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                {m.icon}
                <span className="font-medium">{m.label}</span>
              </button>
            ))}
          </div>
          {payment === 'cash' && (
            <input value={changeFor} onChange={e => setChangeFor(e.target.value)} placeholder="Troco para quanto? (R$)" type="number"
              className="w-full mt-2 p-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
          )}
        </section>

        <section>
          <h2 className="font-heading font-semibold text-sm text-foreground mb-2">Observações</h2>
          <textarea value={observations} onChange={e => setObservations(e.target.value)} placeholder="Alguma observação para o pedido?"
            className="w-full p-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground resize-none h-16 focus:outline-none focus:border-primary" />
        </section>

        <LoyaltyRedeem customerPhone={phone} />

        <section className="bg-secondary/50 rounded-xl p-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground"><span>Subtotal ({items.length} itens)</span><span>{formatPrice(subtotal)}</span></div>
          {orderType === 'delivery' && <div className="flex justify-between text-muted-foreground"><span>Entrega</span><span>{formatPrice(deliveryFee)}</span></div>}
          {loyaltyDiscount > 0 && <div className="flex justify-between text-primary"><span>Pontos fidelidade</span><span>-{formatPrice(loyaltyDiscount)}</span></div>}
          {discount > 0 && <div className="flex justify-between text-success"><span>Desconto total</span><span>-{formatPrice(discount)}</span></div>}
          <div className="flex justify-between font-bold text-foreground pt-1.5 border-t border-border">
            <span>Total</span>
            <span className="text-primary">{formatPrice(actualTotal)}</span>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-3 bg-card/95 backdrop-blur-md border-t border-border">
        <button onClick={handleSubmit} disabled={submitting}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-sm hover:bg-primary/90 transition-colors max-w-lg mx-auto block disabled:opacity-50">
          {submitting ? 'Processando...' : `Confirmar Pedido • ${formatPrice(actualTotal)}`}
        </button>
      </div>
    </div>
  );
}

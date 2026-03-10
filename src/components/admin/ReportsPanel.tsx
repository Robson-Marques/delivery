import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useState } from 'react';

type Period = 'today' | 'week' | 'month';

export function ReportsPanel() {
  const [period, setPeriod] = useState<Period>('today');

  const getStartDate = () => {
    const d = new Date();
    if (period === 'today') d.setHours(0, 0, 0, 0);
    else if (period === 'week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    return d.toISOString();
  };

  const { data: orders = [] } = useQuery({
    queryKey: ['report-orders', period],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('*').gte('created_at', getStartDate()).order('created_at');
      return data || [];
    },
  });

  const { data: orderItems = [] } = useQuery({
    queryKey: ['report-items', period],
    queryFn: async () => {
      const orderIds = orders.map(o => o.id);
      if (!orderIds.length) return [];
      const { data } = await supabase.from('order_items').select('*').in('order_id', orderIds);
      return data || [];
    },
    enabled: orders.length > 0,
  });

  const formatPrice = (p: number) => p.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const avgTicket = orders.length > 0 ? totalRevenue / orders.length : 0;
  const totalDiscount = orders.reduce((s, o) => s + Number(o.discount), 0);
  const totalDeliveryFee = orders.reduce((s, o) => s + Number(o.delivery_fee), 0);

  // Orders by hour
  const hourlyData = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h}h`,
    pedidos: orders.filter(o => new Date(o.created_at).getHours() === h).length,
  })).filter(h => h.pedidos > 0);

  // Payment methods
  const paymentData = ['pix', 'cash', 'card', 'online'].map(m => ({
    name: m === 'pix' ? 'PIX' : m === 'cash' ? 'Dinheiro' : m === 'card' ? 'Cartão' : 'Online',
    value: orders.filter(o => o.payment_method === m).length,
  })).filter(d => d.value > 0);

  // Top products
  const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  orderItems.forEach(item => {
    if (!productMap[item.product_name]) productMap[item.product_name] = { name: item.product_name, qty: 0, revenue: 0 };
    productMap[item.product_name].qty += item.quantity;
    productMap[item.product_name].revenue += Number(item.unit_price) * item.quantity;
  });
  const topProducts = Object.values(productMap).sort((a, b) => b.qty - a.qty).slice(0, 10);

  // Daily revenue (for week/month)
  const dailyMap: Record<string, number> = {};
  orders.forEach(o => {
    const day = new Date(o.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    dailyMap[day] = (dailyMap[day] || 0) + Number(o.total);
  });
  const dailyData = Object.entries(dailyMap).map(([day, revenue]) => ({ day, revenue }));

  const COLORS = ['hsl(0,72%,51%)', 'hsl(25,95%,53%)', 'hsl(142,71%,45%)', 'hsl(217,91%,60%)'];

  const periods: { id: Period; label: string }[] = [
    { id: 'today', label: 'Hoje' },
    { id: 'week', label: '7 dias' },
    { id: 'month', label: '30 dias' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-lg text-foreground">Relatórios</h2>
        <div className="flex bg-secondary rounded-lg p-0.5">
          {periods.map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${period === p.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Pedidos', value: orders.length.toString() },
          { label: 'Faturamento', value: formatPrice(totalRevenue) },
          { label: 'Ticket médio', value: formatPrice(avgTicket) },
          { label: 'Descontos', value: formatPrice(totalDiscount) },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-lg font-heading font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {hourlyData.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-heading font-semibold text-sm text-foreground mb-3">Pedidos por hora</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="pedidos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {paymentData.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-heading font-semibold text-sm text-foreground mb-3">Formas de pagamento</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={paymentData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {dailyData.length > 1 && (
          <div className="bg-card rounded-xl border border-border p-4 md:col-span-2">
            <h3 className="font-heading font-semibold text-sm text-foreground mb-3">Faturamento diário</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(v: number) => formatPrice(v)} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {topProducts.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-3">Top produtos</h3>
          <div className="space-y-2">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="text-sm text-foreground">{p.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-foreground">{p.qty}x</span>
                  <span className="text-xs text-muted-foreground ml-2">{formatPrice(p.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {orders.length === 0 && (
        <p className="text-center text-muted-foreground py-12">Nenhum dado para o período selecionado</p>
      )}
    </div>
  );
}

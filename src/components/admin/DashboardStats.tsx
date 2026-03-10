import { useOrders } from '@/contexts/OrderContext';
import { DollarSign, ShoppingBag, TrendingUp, Truck } from 'lucide-react';

export function DashboardStats() {
  const { orders } = useOrders();

  const todayOrders = orders;
  const totalRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const avgTicket = todayOrders.length > 0 ? totalRevenue / todayOrders.length : 0;
  const deliveryOrders = todayOrders.filter(o => o.type === 'delivery').length;

  const formatPrice = (p: number) => p.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const stats = [
    { label: 'Pedidos hoje', value: todayOrders.length.toString(), icon: <ShoppingBag className="w-5 h-5" />, color: 'text-primary bg-primary/10' },
    { label: 'Faturamento', value: formatPrice(totalRevenue), icon: <DollarSign className="w-5 h-5" />, color: 'text-success bg-success/10' },
    { label: 'Ticket médio', value: formatPrice(avgTicket), icon: <TrendingUp className="w-5 h-5" />, color: 'text-accent bg-accent/10' },
    { label: 'Entregas', value: deliveryOrders.toString(), icon: <Truck className="w-5 h-5" />, color: 'text-delivery-blue bg-delivery-blue/10' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-heading font-bold text-lg text-foreground">Dashboard</h2>
      <div className="grid grid-cols-2 gap-3">
        {stats.map(stat => (
          <div key={stat.label} className="bg-card rounded-xl border border-border p-4">
            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-2`}>
              {stat.icon}
            </div>
            <p className="text-xl font-heading font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="bg-secondary/50 rounded-xl p-6 text-center">
          <p className="text-muted-foreground text-sm">Faça pedidos pelo cardápio para ver os dados aqui</p>
        </div>
      )}

      {orders.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-3">Últimos pedidos</h3>
          <div className="space-y-2">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <span className="font-medium text-sm text-foreground">#{order.number}</span>
                  <span className="text-xs text-muted-foreground ml-2">{order.customer.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-foreground">{formatPrice(order.total)}</span>
                  <span className="text-xs text-muted-foreground block capitalize">{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

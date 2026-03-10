import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats, fetchOrders } from '@/lib/api';
import { DollarSign, ShoppingBag, TrendingUp, Truck } from 'lucide-react';

export function DashboardStats() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 30000,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => fetchOrders(),
  });

  const formatPrice = (p: number) => p.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const statCards = [
    { label: 'Pedidos hoje', value: (stats?.totalOrders || 0).toString(), icon: <ShoppingBag className="w-5 h-5" />, color: 'text-primary bg-primary/10' },
    { label: 'Faturamento', value: formatPrice(stats?.totalRevenue || 0), icon: <DollarSign className="w-5 h-5" />, color: 'text-success bg-success/10' },
    { label: 'Ticket médio', value: formatPrice(stats?.avgTicket || 0), icon: <TrendingUp className="w-5 h-5" />, color: 'text-accent bg-accent/10' },
    { label: 'Entregas', value: (stats?.deliveryCount || 0).toString(), icon: <Truck className="w-5 h-5" />, color: 'text-delivery-blue bg-delivery-blue/10' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-heading font-bold text-lg text-foreground">Dashboard</h2>
      <div className="grid grid-cols-2 gap-3">
        {statCards.map(stat => (
          <div key={stat.label} className="bg-card rounded-xl border border-border p-4">
            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-2`}>{stat.icon}</div>
            <p className="text-xl font-heading font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
      {orders.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-3">Últimos pedidos</h3>
          <div className="space-y-2">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <span className="font-medium text-sm text-foreground">#{order.order_number}</span>
                  <span className="text-xs text-muted-foreground ml-2">{order.customer_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-foreground">{formatPrice(Number(order.total))}</span>
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

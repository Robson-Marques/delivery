import { useOrders, type OrderStatus, type Order } from '@/contexts/OrderContext';
import { Clock, User, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';

interface KanbanBoardProps {
  kitchenMode?: boolean;
}

const allColumns: { status: OrderStatus; label: string; color: string }[] = [
  { status: 'pending', label: '⏳ Pendentes', color: 'bg-warning/10 text-warning' },
  { status: 'accepted', label: '✅ Aceitos', color: 'bg-delivery-blue/10 text-delivery-blue' },
  { status: 'preparing', label: '👨‍🍳 Em preparo', color: 'bg-accent/10 text-accent' },
  { status: 'ready', label: '✨ Prontos', color: 'bg-success/10 text-success' },
  { status: 'delivering', label: '🛵 Em entrega', color: 'bg-delivery-purple/10 text-delivery-purple' },
  { status: 'done', label: '🎉 Finalizados', color: 'bg-muted text-muted-foreground' },
];

export function KanbanBoard({ kitchenMode }: KanbanBoardProps) {
  const { orders, updateOrderStatus } = useOrders();

  const columns = kitchenMode
    ? allColumns.filter(c => ['accepted', 'preparing'].includes(c.status))
    : allColumns;

  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    const flow: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'delivering', 'done'];
    const idx = flow.indexOf(current);
    return idx < flow.length - 1 ? flow[idx + 1] : null;
  };

  const formatTime = (date: Date) => {
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    return mins < 1 ? 'agora' : `${mins}min`;
  };

  const formatPrice = (p: number) => p.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getOrdersByStatus = (status: OrderStatus) =>
    orders.filter(o => o.status === status).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className={`grid gap-3 ${kitchenMode ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'}`}>
      {columns.map(col => (
        <div key={col.status} className="kanban-column">
          <div className="flex items-center justify-between mb-2">
            <span className={`status-badge ${col.color}`}>{col.label}</span>
            <span className="text-xs text-muted-foreground">{getOrdersByStatus(col.status).length}</span>
          </div>

          <div className="space-y-2">
            {getOrdersByStatus(col.status).map(order => (
              <OrderCard
                key={order.id}
                order={order}
                kitchenMode={kitchenMode}
                onAdvance={() => {
                  const next = getNextStatus(order.status);
                  if (next) updateOrderStatus(order.id, next);
                }}
                formatTime={formatTime}
                formatPrice={formatPrice}
              />
            ))}
          </div>
        </div>
      ))}

      {orders.length === 0 && (
        <div className="col-span-full text-center py-16">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-muted-foreground">Nenhum pedido ainda</p>
          <p className="text-xs text-muted-foreground mt-1">Faça um pedido pelo cardápio para ver aqui</p>
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  kitchenMode,
  onAdvance,
  formatTime,
  formatPrice,
}: {
  order: Order;
  kitchenMode?: boolean;
  onAdvance: () => void;
  formatTime: (d: Date) => string;
  formatPrice: (p: number) => string;
}) {
  const nextLabels: Record<string, string> = {
    pending: 'Aceitar',
    accepted: 'Preparar',
    preparing: 'Pronto',
    ready: 'Enviar',
    delivering: 'Finalizar',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card rounded-lg border border-border p-3 shadow-sm"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-heading font-bold text-sm text-foreground">#{order.number}</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {formatTime(order.createdAt)}
        </span>
      </div>

      <div className="space-y-1 mb-2">
        {order.items.map((item, i) => (
          <div key={i} className="text-xs text-foreground">
            <span className="font-medium">{item.quantity}x</span> {item.menuItem.name}
            {item.size && <span className="text-muted-foreground"> ({item.size})</span>}
            {item.secondFlavor && <span className="text-muted-foreground"> + {item.secondFlavor.name}</span>}
            {item.observations && (
              <p className="text-muted-foreground italic ml-3">"{item.observations}"</p>
            )}
          </div>
        ))}
      </div>

      {!kitchenMode && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <User className="w-3 h-3" />
          <span>{order.customer.name}</span>
          <CreditCard className="w-3 h-3 ml-auto" />
          <span className="capitalize">{order.payment}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        {!kitchenMode && <span className="text-sm font-bold text-foreground">{formatPrice(order.total)}</span>}
        {order.status !== 'done' && (
          <button
            onClick={onAdvance}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors ml-auto"
          >
            {nextLabels[order.status] || 'Avançar'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

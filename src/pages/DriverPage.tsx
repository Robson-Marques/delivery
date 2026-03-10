import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchOrders, fetchOrderItems, updateOrderStatus, subscribeToOrders, type Order } from '@/lib/api';
import { MapPin, Phone, Clock, CheckCircle2, Navigation, LogIn, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useState } from 'react';

export default function DriverPage() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ['driver-orders'],
    queryFn: async () => {
      const { data } = await supabase.from('orders')
        .select('*')
        .in('status', ['ready', 'delivering'])
        .eq('order_type', 'delivery')
        .order('created_at', { ascending: true });
      return data || [];
    },
    refetchInterval: 10000,
  });

  useEffect(() => {
    const channel = subscribeToOrders(() => {
      queryClient.invalidateQueries({ queryKey: ['driver-orders'] });
    });
    return () => { channel.unsubscribe(); };
  }, [queryClient]);

  const handlePickup = async (orderId: string) => {
    await updateOrderStatus(orderId, 'delivering');
    toast.success('Pedido em rota!');
    queryClient.invalidateQueries({ queryKey: ['driver-orders'] });
  };

  const handleDeliver = async (orderId: string) => {
    await updateOrderStatus(orderId, 'done');
    toast.success('Pedido entregue!');
    queryClient.invalidateQueries({ queryKey: ['driver-orders'] });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Faça login para acessar</p>
        <button onClick={() => navigate('/login')} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          <LogIn className="w-4 h-4" /> Entrar
        </button>
      </div>
    );
  }

  const readyOrders = orders.filter(o => o.status === 'ready');
  const deliveringOrders = orders.filter(o => o.status === 'delivering');

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="container flex items-center gap-3 h-14 px-4">
          <button onClick={() => navigate('/')} className="p-1.5 rounded-full hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-heading font-bold text-foreground">🛵 Entregas</h1>
          <span className="ml-auto text-xs text-muted-foreground">{orders.length} pedido(s)</span>
        </div>
      </header>

      <main className="container px-4 py-4 space-y-4 max-w-lg mx-auto">
        {readyOrders.length > 0 && (
          <section>
            <h2 className="font-heading font-semibold text-sm text-foreground mb-2 flex items-center gap-1.5">
              ✨ Prontos para retirar ({readyOrders.length})
            </h2>
            <div className="space-y-3">
              {readyOrders.map(order => (
                <DriverOrderCard key={order.id} order={order} onAction={() => handlePickup(order.id)} actionLabel="Pegar pedido" actionColor="bg-delivery-blue" />
              ))}
            </div>
          </section>
        )}

        {deliveringOrders.length > 0 && (
          <section>
            <h2 className="font-heading font-semibold text-sm text-foreground mb-2 flex items-center gap-1.5">
              🛵 Em rota ({deliveringOrders.length})
            </h2>
            <div className="space-y-3">
              {deliveringOrders.map(order => (
                <DriverOrderCard key={order.id} order={order} onAction={() => handleDeliver(order.id)} actionLabel="Marcar entregue" actionColor="bg-success" />
              ))}
            </div>
          </section>
        )}

        {orders.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🛵</p>
            <p className="text-muted-foreground">Nenhuma entrega no momento</p>
            <p className="text-xs text-muted-foreground mt-1">Aguarde pedidos prontos</p>
          </div>
        )}
      </main>
    </div>
  );
}

function DriverOrderCard({ order, onAction, actionLabel, actionColor }: {
  order: Order; onAction: () => void; actionLabel: string; actionColor: string;
}) {
  const [items, setItems] = useState<{ product_name: string; quantity: number }[]>([]);

  useEffect(() => {
    fetchOrderItems(order.id).then(data => setItems(data || []));
  }, [order.id]);

  const formatTime = (d: string) => {
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    return mins < 1 ? 'agora' : `${mins}min`;
  };

  const address = [order.delivery_address, order.delivery_number, order.delivery_neighborhood].filter(Boolean).join(', ');
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-heading font-bold text-foreground">#{order.order_number}</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" /> {formatTime(order.created_at)}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-foreground">{address}</p>
            {order.delivery_complement && <p className="text-xs text-muted-foreground">{order.delivery_complement}</p>}
            {order.delivery_reference && <p className="text-xs text-muted-foreground">Ref: {order.delivery_reference}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-muted-foreground" />
          <a href={`tel:${order.customer_phone}`} className="text-sm text-primary">{order.customer_name} - {order.customer_phone}</a>
        </div>
      </div>

      <div className="text-xs text-muted-foreground space-y-0.5">
        {items.map((item, i) => (
          <p key={i}>{item.quantity}x {item.product_name}</p>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-sm font-bold text-foreground">
          {Number(order.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          <span className="text-xs font-normal text-muted-foreground ml-1 capitalize">({order.payment_method})</span>
        </span>
        {order.change_for && <span className="text-xs text-warning">Troco: R$ {Number(order.change_for).toFixed(2)}</span>}
      </div>

      <div className="flex gap-2">
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
          className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground font-medium text-sm flex items-center justify-center gap-1.5">
          <Navigation className="w-4 h-4" /> Navegar
        </a>
        <button onClick={onAction}
          className={`flex-1 py-2.5 rounded-xl ${actionColor} text-primary-foreground font-medium text-sm flex items-center justify-center gap-1.5`}>
          <CheckCircle2 className="w-4 h-4" /> {actionLabel}
        </button>
      </div>
    </motion.div>
  );
}

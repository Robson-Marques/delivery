import { useNavigate, useParams } from 'react-router-dom';
import { useOrders } from '@/contexts/OrderContext';
import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OrderConfirmation() {
  const { id } = useParams();
  const { orders } = useOrders();
  const navigate = useNavigate();
  const order = orders.find(o => o.id === id);

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Pedido não encontrado</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
            Voltar ao cardápio
          </button>
        </div>
      </div>
    );
  }

  const formatPrice = (p: number) => p.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card rounded-2xl shadow-lg p-6 max-w-sm w-full text-center"
      >
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
        </motion.div>

        <h1 className="font-heading text-2xl font-bold text-foreground mb-1">Pedido Confirmado!</h1>
        <p className="text-muted-foreground text-sm mb-4">Seu pedido foi recebido com sucesso</p>

        <div className="bg-secondary/50 rounded-xl p-4 mb-4">
          <p className="text-xs text-muted-foreground">Número do pedido</p>
          <p className="font-heading text-3xl font-bold text-primary">#{order.number}</p>
        </div>

        <div className="space-y-2 text-sm text-left mb-6">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cliente</span>
            <span className="font-medium text-foreground">{order.customer.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tipo</span>
            <span className="font-medium text-foreground">
              {order.type === 'delivery' ? '🛵 Entrega' : order.type === 'pickup' ? '🏪 Retirada' : '🍽️ No local'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pagamento</span>
            <span className="font-medium text-foreground capitalize">{order.payment}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <span className="font-bold text-foreground">Total</span>
            <span className="font-bold text-primary">{formatPrice(order.total)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-sm"
          >
            Fazer novo pedido
          </button>
          <button
            onClick={() => navigate('/admin')}
            className="w-full py-2.5 rounded-xl bg-secondary text-secondary-foreground font-heading font-semibold text-sm"
          >
            Painel admin
          </button>
        </div>
      </motion.div>
    </div>
  );
}

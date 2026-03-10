import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, User, Phone, MapPin, ShoppingBag, Star, ChevronDown, ChevronUp, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomerWithOrders {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  neighborhood: string | null;
  total_orders: number;
  total_spent: number;
  loyalty_points: number;
  created_at: string;
}

export function CustomerCRM() {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'total_spent' | 'total_orders' | 'loyalty_points'>('total_spent');

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers-crm'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as CustomerWithOrders[];
    },
  });

  const filtered = customers
    .filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.phone.includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return Number(b[sortBy]) - Number(a[sortBy]);
    });

  const formatPrice = (p: number) => Number(p).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const totalCustomers = customers.length;
  const totalSpent = customers.reduce((s, c) => s + Number(c.total_spent), 0);
  const avgTicket = totalCustomers > 0 ? totalSpent / customers.reduce((s, c) => s + c.total_orders, 0) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-lg text-foreground">Clientes</h2>
        <span className="text-xs text-muted-foreground">{totalCustomers} cadastrados</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total clientes', value: totalCustomers.toString(), icon: <User className="w-4 h-4" /> },
          { label: 'Receita total', value: formatPrice(totalSpent), icon: <ShoppingBag className="w-4 h-4" /> },
          { label: 'Ticket médio', value: formatPrice(avgTicket || 0), icon: <Star className="w-4 h-4" /> },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">{s.icon}<span className="text-xs">{s.label}</span></div>
            <p className="text-sm font-heading font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone..."
            className="w-full pl-8 p-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary" />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="p-2 rounded-lg border border-border bg-background text-sm text-foreground">
          <option value="total_spent">Maior gasto</option>
          <option value="total_orders">Mais pedidos</option>
          <option value="loyalty_points">Mais pontos</option>
          <option value="name">Nome A-Z</option>
        </select>
      </div>

      <div className="space-y-2">
        {filtered.map(customer => (
          <CustomerCard key={customer.id} customer={customer} expanded={expandedId === customer.id}
            onToggle={() => setExpandedId(expandedId === customer.id ? null : customer.id)} />
        ))}
        {isLoading && <p className="text-center text-muted-foreground py-8">Carregando...</p>}
        {!isLoading && filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado ainda'}
          </p>
        )}
      </div>
    </div>
  );
}

function CustomerCard({ customer, expanded, onToggle }: {
  customer: CustomerWithOrders; expanded: boolean; onToggle: () => void;
}) {
  const formatPrice = (p: number) => Number(p).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const { data: orders = [] } = useQuery({
    queryKey: ['customer-orders', customer.id],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('id, order_number, total, status, created_at, payment_method, order_type')
        .eq('customer_id', customer.id).order('created_at', { ascending: false }).limit(10);
      return data || [];
    },
    enabled: expanded,
  });

  const loyaltyTier = customer.loyalty_points >= 500 ? { name: 'Ouro', color: 'text-warning' }
    : customer.loyalty_points >= 200 ? { name: 'Prata', color: 'text-muted-foreground' }
    : customer.loyalty_points >= 50 ? { name: 'Bronze', color: 'text-accent' }
    : null;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button onClick={onToggle} className="w-full p-3 flex items-center gap-3 text-left hover:bg-secondary/30 transition-colors">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm text-foreground truncate">{customer.name}</p>
            {loyaltyTier && (
              <span className={`flex items-center gap-0.5 text-xs font-medium ${loyaltyTier.color}`}>
                <Award className="w-3 h-3" /> {loyaltyTier.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone}</span>
            {customer.neighborhood && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {customer.neighborhood}</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-foreground">{formatPrice(customer.total_spent)}</p>
          <p className="text-xs text-muted-foreground">{customer.total_orders} pedidos</p>
        </div>
        <div className="flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-3 pb-3 border-t border-border pt-3 space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 bg-primary/5 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-heading font-bold text-primary">{customer.loyalty_points}</p>
                  <p className="text-xs text-muted-foreground">Pontos</p>
                </div>
                <div className="flex-1 bg-secondary rounded-lg p-2.5 text-center">
                  <p className="text-lg font-heading font-bold text-foreground">
                    {customer.total_orders > 0 ? formatPrice(customer.total_spent / customer.total_orders) : 'R$ 0'}
                  </p>
                  <p className="text-xs text-muted-foreground">Ticket médio</p>
                </div>
              </div>

              {customer.address && (
                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  {[customer.address, customer.neighborhood].filter(Boolean).join(', ')}
                </p>
              )}

              <div>
                <p className="text-xs font-medium text-foreground mb-2">Últimos pedidos</p>
                {orders.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum pedido registrado</p>
                ) : (
                  <div className="space-y-1.5">
                    {orders.map(order => (
                      <div key={order.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                        <div>
                          <span className="text-xs font-medium text-foreground">#{order.order_number}</span>
                          <span className="text-xs text-muted-foreground ml-1.5">
                            {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`status-badge text-xs ${
                            order.status === 'done' ? 'bg-success/10 text-success' :
                            order.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                            'bg-warning/10 text-warning'
                          }`}>{order.status === 'done' ? 'Entregue' : order.status === 'cancelled' ? 'Cancelado' : 'Em andamento'}</span>
                          <span className="text-xs font-bold text-foreground">{formatPrice(Number(order.total))}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Cliente desde {new Date(customer.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

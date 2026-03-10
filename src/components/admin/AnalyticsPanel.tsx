import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsEvent {
  event_type: string;
  session_id: string;
  created_at: string;
  metadata: Record<string, unknown>;
}

export function AnalyticsPanel() {
  const { data: events = [] } = useQuery({
    queryKey: ['analytics-events'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data } = await (supabase as any).from('analytics_events')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });
      return (data || []) as AnalyticsEvent[];
    },
  });

  const countByType = (type: string) => events.filter(e => e.event_type === type).length;
  const uniqueSessions = (type: string) => new Set(events.filter(e => e.event_type === type).map(e => e.session_id)).size;

  const funnelData = [
    { name: 'Visitas cardápio', value: uniqueSessions('menu_view'), fill: 'hsl(var(--primary))' },
    { name: 'Adicionou ao carrinho', value: uniqueSessions('add_to_cart'), fill: 'hsl(var(--accent))' },
    { name: 'Iniciou checkout', value: uniqueSessions('checkout_start'), fill: 'hsl(var(--warning))' },
    { name: 'Pedido completo', value: uniqueSessions('order_complete'), fill: 'hsl(var(--success))' },
  ];

  const conversionRate = (from: number, to: number) => from > 0 ? ((to / from) * 100).toFixed(1) : '0';

  const dailyMap: Record<string, number> = {};
  events.forEach(e => {
    const day = new Date(e.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    dailyMap[day] = (dailyMap[day] || 0) + 1;
  });
  const dailyData = Object.entries(dailyMap).reverse().slice(0, 14).reverse().map(([day, count]) => ({ day, eventos: count }));

  const totalVisits = uniqueSessions('menu_view');
  const totalOrders = uniqueSessions('order_complete');
  const overallConversion = conversionRate(totalVisits, totalOrders);

  return (
    <div className="space-y-4">
      <h2 className="font-heading font-bold text-lg text-foreground">Analytics</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Visitas', value: countByType('menu_view').toString() },
          { label: 'Add carrinho', value: countByType('add_to_cart').toString() },
          { label: 'Checkouts', value: countByType('checkout_start').toString() },
          { label: 'Conversão', value: `${overallConversion}%` },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-lg font-heading font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-heading font-semibold text-sm text-foreground mb-3">Funil de Vendas</h3>
        <div className="space-y-2">
          {funnelData.map((step, i) => {
            const maxVal = funnelData[0].value || 1;
            const pct = maxVal > 0 ? (step.value / maxVal) * 100 : 0;
            const prevStep = i > 0 ? funnelData[i - 1] : null;
            const dropoff = prevStep ? conversionRate(prevStep.value, step.value) : '100';
            return (
              <div key={step.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-foreground">{step.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {step.value} {i > 0 && <span className="text-primary">({dropoff}%)</span>}
                  </span>
                </div>
                <div className="h-6 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: step.fill }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {dailyData.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-3">Eventos por dia</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Bar dataKey="eventos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {events.length === 0 && (
        <p className="text-center text-muted-foreground py-8">Nenhum dado de analytics ainda. Dados serão coletados automaticamente.</p>
      )}
    </div>
  );
}

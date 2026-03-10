import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, Save, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';

export function CouponManager() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '', discount_type: 'percentage' as 'fixed' | 'percentage',
    discount_value: '', min_order_value: '', max_uses: '', valid_until: '',
  });

  const { data: coupons = [] } = useQuery({
    queryKey: ['coupons-admin'],
    queryFn: async () => {
      const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const handleSave = async () => {
    if (!form.code || !form.discount_value) { toast.error('Código e valor são obrigatórios'); return; }
    const { error } = await supabase.from('coupons').insert({
      code: form.code.toUpperCase(),
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      min_order_value: form.min_order_value ? parseFloat(form.min_order_value) : null,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      valid_until: form.valid_until || null,
    });
    if (error) { toast.error('Erro ao criar cupom'); return; }
    toast.success('Cupom criado!');
    setForm({ code: '', discount_type: 'percentage', discount_value: '', min_order_value: '', max_uses: '', valid_until: '' });
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ['coupons-admin'] });
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('coupons').update({ is_active: !active }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['coupons-admin'] });
  };

  const formatPrice = (p: number) => Number(p).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-foreground">Cupons</h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium">
          <Plus className="w-4 h-4" /> Novo cupom
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="Código *"
              className="p-2.5 rounded-lg border border-border bg-background text-sm text-foreground uppercase focus:outline-none focus:border-primary" />
            <select value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value as 'fixed' | 'percentage' })}
              className="p-2.5 rounded-lg border border-border bg-background text-sm text-foreground">
              <option value="percentage">Percentual (%)</option>
              <option value="fixed">Valor fixo (R$)</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input type="number" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} placeholder="Valor *"
              className="p-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary" />
            <input type="number" value={form.min_order_value} onChange={e => setForm({ ...form, min_order_value: e.target.value })} placeholder="Pedido mín."
              className="p-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary" />
            <input type="number" value={form.max_uses} onChange={e => setForm({ ...form, max_uses: e.target.value })} placeholder="Limite usos"
              className="p-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary" />
          </div>
          <input type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })}
            className="w-full p-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary" />
          <button onClick={handleSave} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-sm flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> Criar cupom
          </button>
        </div>
      )}

      <div className="space-y-2">
        {coupons.map(c => (
          <div key={c.id} className={`bg-card rounded-lg border border-border p-3 flex items-center gap-3 ${!c.is_active ? 'opacity-50' : ''}`}>
            <div className="flex-1">
              <p className="font-mono font-bold text-sm text-foreground">{c.code}</p>
              <p className="text-xs text-muted-foreground">
                {c.discount_type === 'percentage' ? `${c.discount_value}%` : formatPrice(c.discount_value)} off
                {c.min_order_value ? ` • Min ${formatPrice(c.min_order_value)}` : ''}
                {c.max_uses ? ` • ${c.current_uses}/${c.max_uses} usos` : ` • ${c.current_uses} usos`}
              </p>
            </div>
            <button onClick={() => toggleActive(c.id, c.is_active)} className="p-1.5">
              {c.is_active ? <ToggleRight className="w-6 h-6 text-success" /> : <ToggleLeft className="w-6 h-6 text-muted-foreground" />}
            </button>
          </div>
        ))}
        {coupons.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">Nenhum cupom cadastrado</p>}
      </div>
    </div>
  );
}

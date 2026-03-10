import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, Phone, ToggleLeft, ToggleRight, Save } from 'lucide-react';
import { toast } from 'sonner';

export function DriverManager() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers-admin'],
    queryFn: async () => {
      const { data } = await supabase.from('delivery_drivers').select('*').order('name');
      return data || [];
    },
  });

  const handleSave = async () => {
    if (!form.name || !form.phone) { toast.error('Nome e telefone são obrigatórios'); return; }
    const { error } = await supabase.from('delivery_drivers').insert({ name: form.name, phone: form.phone });
    if (error) { toast.error('Erro ao cadastrar'); return; }
    toast.success('Entregador cadastrado!');
    setForm({ name: '', phone: '' });
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ['drivers-admin'] });
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('delivery_drivers').update({ is_active: !active }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['drivers-admin'] });
  };

  const toggleAvailable = async (id: string, available: boolean) => {
    await supabase.from('delivery_drivers').update({ is_available: !available }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['drivers-admin'] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-foreground">Entregadores</h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium">
          <Plus className="w-4 h-4" /> Novo entregador
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome *"
            className="w-full p-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary" />
          <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Telefone *"
            className="w-full p-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary" />
          <button onClick={handleSave} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-sm flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> Cadastrar
          </button>
        </div>
      )}

      <div className="space-y-2">
        {drivers.map(d => (
          <div key={d.id} className={`bg-card rounded-lg border border-border p-3 flex items-center gap-3 ${!d.is_active ? 'opacity-50' : ''}`}>
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${d.is_available && d.is_active ? 'bg-success' : 'bg-muted-foreground'}`} />
            <div className="flex-1">
              <p className="font-medium text-sm text-foreground">{d.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {d.phone}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggleAvailable(d.id, d.is_available)} title={d.is_available ? 'Disponível' : 'Indisponível'}
                className={`px-2 py-1 rounded text-xs font-medium ${d.is_available ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                {d.is_available ? 'Online' : 'Offline'}
              </button>
              <button onClick={() => toggleActive(d.id, d.is_active)} className="p-1.5">
                {d.is_active ? <ToggleRight className="w-5 h-5 text-success" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
              </button>
            </div>
          </div>
        ))}
        {drivers.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">Nenhum entregador cadastrado</p>}
      </div>
    </div>
  );
}

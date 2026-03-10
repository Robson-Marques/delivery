import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CouponManager } from './CouponManager';
import { DriverManager } from './DriverManager';
import { QRCodeDisplay } from './QRCodeDisplay';
import { OpeningHoursEditor } from './OpeningHoursEditor';
import { useEffect } from 'react';

export function SettingsPanel() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'general' | 'hours' | 'neighborhoods' | 'coupons' | 'drivers' | 'qrcode'>('general');

  const { data: settings } = useQuery({
    queryKey: ['establishment-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('establishment_settings').select('*').limit(1).single();
      return data;
    },
  });

  const { data: neighborhoods = [] } = useQuery({
    queryKey: ['neighborhoods'],
    queryFn: async () => {
      const { data } = await supabase.from('neighborhoods').select('*').order('name');
      return data || [];
    },
  });

  const [form, setForm] = useState({
    name: '', phone: '', cnpj: '', address: '',
    default_delivery_fee: '5.99', is_open: true,
  });

  const [newNeighborhood, setNewNeighborhood] = useState({ name: '', delivery_fee: '5.99' });

  useEffect(() => {
    if (settings) {
      setForm({
        name: settings.name || '',
        phone: settings.phone || '',
        cnpj: settings.cnpj || '',
        address: settings.address || '',
        default_delivery_fee: String(settings.default_delivery_fee || 5.99),
        is_open: settings.is_open ?? true,
      });
    }
  }, [settings]);

  const saveSettings = async () => {
    if (!settings) return;
    const { error } = await supabase.from('establishment_settings').update({
      name: form.name, phone: form.phone, cnpj: form.cnpj, address: form.address,
      default_delivery_fee: parseFloat(form.default_delivery_fee), is_open: form.is_open,
    }).eq('id', settings.id);
    if (error) { toast.error('Erro ao salvar'); return; }
    toast.success('Configurações salvas!');
    queryClient.invalidateQueries({ queryKey: ['establishment-settings'] });
  };

  const addNeighborhood = async () => {
    if (!newNeighborhood.name) { toast.error('Nome do bairro é obrigatório'); return; }
    const { error } = await supabase.from('neighborhoods').insert({
      name: newNeighborhood.name, delivery_fee: parseFloat(newNeighborhood.delivery_fee) || 5.99,
    });
    if (error) { toast.error('Erro ao adicionar'); return; }
    toast.success('Bairro adicionado!');
    setNewNeighborhood({ name: '', delivery_fee: '5.99' });
    queryClient.invalidateQueries({ queryKey: ['neighborhoods'] });
  };

  const removeNeighborhood = async (id: string) => {
    await supabase.from('neighborhoods').update({ is_active: false }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['neighborhoods'] });
  };

  const formatPrice = (p: number) => Number(p).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const tabs = [
    { id: 'general' as const, label: 'Geral' },
    { id: 'neighborhoods' as const, label: 'Bairros' },
    { id: 'coupons' as const, label: 'Cupons' },
    { id: 'drivers' as const, label: 'Entregadores' },
    { id: 'qrcode' as const, label: 'QR Code' },
  ];

  return (
    <div className="space-y-4 max-w-lg">
      <div className="flex overflow-x-auto scrollbar-hide gap-1 bg-secondary rounded-lg p-0.5">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <section>
          <h2 className="font-heading font-bold text-lg text-foreground mb-3">Estabelecimento</h2>
          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome"
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary" />
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Telefone"
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary" />
            <input value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} placeholder="CNPJ"
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary" />
            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Endereço"
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary" />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={form.is_open} onChange={e => setForm({ ...form, is_open: e.target.checked })} className="rounded border-border" />
                Estabelecimento aberto
              </label>
              <input type="number" step="0.01" value={form.default_delivery_fee} onChange={e => setForm({ ...form, default_delivery_fee: e.target.value })}
                placeholder="Taxa padrão" className="w-28 p-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <button onClick={saveSettings} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-sm flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> Salvar configurações
            </button>
          </div>
        </section>
      )}

      {tab === 'neighborhoods' && (
        <section>
          <h2 className="font-heading font-bold text-lg text-foreground mb-3">Bairros e Taxas</h2>
          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <div className="flex gap-2">
              <input value={newNeighborhood.name} onChange={e => setNewNeighborhood({ ...newNeighborhood, name: e.target.value })} placeholder="Nome do bairro"
                className="flex-1 p-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary" />
              <input type="number" step="0.01" value={newNeighborhood.delivery_fee} onChange={e => setNewNeighborhood({ ...newNeighborhood, delivery_fee: e.target.value })} placeholder="Taxa"
                className="w-24 p-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary" />
              <button onClick={addNeighborhood} className="p-2 rounded-lg bg-primary text-primary-foreground"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="space-y-1">
              {neighborhoods.filter(n => n.is_active).map(n => (
                <div key={n.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-foreground">{n.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{formatPrice(n.delivery_fee)}</span>
                    <button onClick={() => removeNeighborhood(n.id)} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                  </div>
                </div>
              ))}
              {neighborhoods.filter(n => n.is_active).length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhum bairro cadastrado</p>}
            </div>
          </div>
        </section>
      )}

      {tab === 'coupons' && <CouponManager />}
      {tab === 'drivers' && <DriverManager />}
      {tab === 'qrcode' && <QRCodeDisplay />}
    </div>
  );
}

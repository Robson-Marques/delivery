import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Save, Clock, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';

interface DaySchedule {
  open: string;
  close: string;
  enabled: boolean;
}

type WeekSchedule = Record<string, DaySchedule>;

const DAYS = [
  { key: 'mon', label: 'Segunda' },
  { key: 'tue', label: 'Terça' },
  { key: 'wed', label: 'Quarta' },
  { key: 'thu', label: 'Quinta' },
  { key: 'fri', label: 'Sexta' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
];

const DEFAULT_SCHEDULE: WeekSchedule = {
  mon: { open: '18:00', close: '23:00', enabled: true },
  tue: { open: '18:00', close: '23:00', enabled: true },
  wed: { open: '18:00', close: '23:00', enabled: true },
  thu: { open: '18:00', close: '23:00', enabled: true },
  fri: { open: '18:00', close: '23:00', enabled: true },
  sat: { open: '18:00', close: '23:30', enabled: true },
  sun: { open: '18:00', close: '23:00', enabled: true },
};

function parseSchedule(raw: unknown): WeekSchedule {
  if (!raw || typeof raw !== 'object') return DEFAULT_SCHEDULE;
  const obj = raw as Record<string, any>;
  const schedule: WeekSchedule = {};
  for (const day of DAYS) {
    const d = obj[day.key];
    schedule[day.key] = {
      open: d?.open || '18:00',
      close: d?.close || '23:00',
      enabled: d?.enabled !== false,
    };
  }
  return schedule;
}

export function OpeningHoursEditor() {
  const queryClient = useQueryClient();
  const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE);
  const [autoToggle, setAutoToggle] = useState(true);
  const [saving, setSaving] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['establishment-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('establishment_settings').select('*').limit(1).single();
      return data;
    },
  });

  useEffect(() => {
    if (settings?.opening_hours) {
      const parsed = parseSchedule(settings.opening_hours);
      setSchedule(parsed);
      const raw = settings.opening_hours as Record<string, any>;
      setAutoToggle(raw?.auto_toggle !== false);
    }
  }, [settings]);

  const updateDay = (key: string, field: keyof DaySchedule, value: string | boolean) => {
    setSchedule(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const applyToAll = (key: string) => {
    const source = schedule[key];
    setSchedule(prev => {
      const next = { ...prev };
      for (const day of DAYS) {
        next[day.key] = { ...source };
      }
      return next;
    });
    toast.info('Horário aplicado a todos os dias');
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const payload = { ...schedule, auto_toggle: autoToggle };
    const { error } = await supabase
      .from('establishment_settings')
      .update({ opening_hours: payload })
      .eq('id', settings.id);
    setSaving(false);
    if (error) { toast.error('Erro ao salvar horários'); return; }
    toast.success('Horários salvos!');
    queryClient.invalidateQueries({ queryKey: ['establishment-settings'] });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" /> Horários de Funcionamento
      </h3>

      <div className="bg-card rounded-xl border border-border p-4 space-y-4">
        {/* Auto toggle setting */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <p className="text-sm font-medium text-foreground">Abrir/fechar automaticamente</p>
            <p className="text-xs text-muted-foreground">O sistema abre e fecha o estabelecimento conforme os horários</p>
          </div>
          <button onClick={() => setAutoToggle(!autoToggle)} className="p-1">
            {autoToggle
              ? <ToggleRight className="w-8 h-8 text-success" />
              : <ToggleLeft className="w-8 h-8 text-muted-foreground" />
            }
          </button>
        </div>

        {/* Days grid */}
        <div className="space-y-2">
          {DAYS.map(day => {
            const s = schedule[day.key];
            return (
              <div key={day.key} className={`flex items-center gap-2 p-2.5 rounded-lg border border-border transition-colors ${s.enabled ? 'bg-background' : 'bg-muted/50 opacity-60'}`}>
                <button
                  onClick={() => updateDay(day.key, 'enabled', !s.enabled)}
                  className="flex-shrink-0"
                >
                  {s.enabled
                    ? <ToggleRight className="w-5 h-5 text-success" />
                    : <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                  }
                </button>
                <span className="w-20 text-sm font-medium text-foreground">{day.label}</span>
                <input
                  type="time"
                  value={s.open}
                  onChange={e => updateDay(day.key, 'open', e.target.value)}
                  disabled={!s.enabled}
                  className="px-2 py-1 rounded-md border border-border bg-background text-sm text-foreground disabled:opacity-40 focus:outline-none focus:border-primary"
                />
                <span className="text-xs text-muted-foreground">às</span>
                <input
                  type="time"
                  value={s.close}
                  onChange={e => updateDay(day.key, 'close', e.target.value)}
                  disabled={!s.enabled}
                  className="px-2 py-1 rounded-md border border-border bg-background text-sm text-foreground disabled:opacity-40 focus:outline-none focus:border-primary"
                />
                <button
                  onClick={() => applyToAll(day.key)}
                  disabled={!s.enabled}
                  className="ml-auto text-xs text-primary hover:underline disabled:opacity-40 disabled:no-underline whitespace-nowrap"
                >
                  Aplicar a todos
                </button>
              </div>
            );
          })}
        </div>

        {/* Current status indicator */}
        {autoToggle && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
            <div className={`w-2.5 h-2.5 rounded-full ${settings?.is_open ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
            <span className="text-sm text-foreground">
              Status atual: <strong>{settings?.is_open ? 'Aberto' : 'Fechado'}</strong>
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {autoToggle ? 'Controle automático ativo' : 'Manual'}
            </span>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar horários'}
        </button>
      </div>
    </div>
  );
}

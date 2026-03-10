import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_LABELS: Record<string, string> = {
  mon: 'Seg', tue: 'Ter', wed: 'Qua', thu: 'Qui', fri: 'Sex', sat: 'Sáb', sun: 'Dom',
};
const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export function ClosedBanner() {
  const { data: settings } = useQuery({
    queryKey: ['establishment-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('establishment_settings').select('*').limit(1).single();
      return data;
    },
    refetchInterval: 60000,
  });

  if (!settings || settings.is_open) return null;

  const hours = settings.opening_hours as Record<string, any> | null;

  // Find next opening
  const now = new Date();
  const currentDayIdx = now.getDay(); // 0=Sun
  let nextOpen: string | null = null;

  for (let i = 0; i < 7; i++) {
    const checkIdx = (currentDayIdx + i) % 7;
    const dayKey = DAY_KEYS[checkIdx];
    const schedule = hours?.[dayKey];
    if (schedule && schedule.enabled !== false) {
      if (i === 0) {
        // Check if still can open today
        const [h, m] = (schedule.open || '18:00').split(':').map(Number);
        const openMin = h * 60 + m;
        const nowMin = now.getHours() * 60 + now.getMinutes();
        if (nowMin < openMin) {
          nextOpen = `Hoje às ${schedule.open}`;
          break;
        }
      } else {
        const dayLabel = i === 1 ? 'Amanhã' : DAY_LABELS[dayKey];
        nextOpen = `${dayLabel} às ${schedule.open}`;
        break;
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-destructive/10 border border-destructive/20 rounded-xl mx-4 mt-3 overflow-hidden"
    >
      <div className="flex items-center gap-3 p-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-destructive" />
        </div>
        <div className="flex-1">
          <p className="font-heading font-bold text-sm text-foreground">
            Estamos fechados no momento
          </p>
          {nextOpen && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Abrimos {nextOpen}
            </p>
          )}
        </div>
      </div>

      {/* Schedule grid */}
      {hours && (
        <div className="border-t border-destructive/10 px-4 py-3 bg-destructive/5">
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Horários de funcionamento</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {DAY_ORDER.map(key => {
              const s = hours[key];
              const enabled = s && s.enabled !== false;
              const todayKey = DAY_KEYS[now.getDay()];
              const isToday = key === todayKey;
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between text-xs py-0.5 ${isToday ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
                >
                  <span>{DAY_LABELS[key]}{isToday ? ' •' : ''}</span>
                  <span>{enabled ? `${s.open} - ${s.close}` : 'Fechado'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function useAutoOpenClose() {
  const queryClient = useQueryClient();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: settings } = useQuery({
    queryKey: ['establishment-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('establishment_settings').select('*').limit(1).single();
      return data;
    },
    refetchInterval: 60000, // refetch every minute
  });

  useEffect(() => {
    const check = async () => {
      if (!settings) return;
      const hours = settings.opening_hours as Record<string, any> | null;
      if (!hours || hours.auto_toggle === false) return;

      const now = new Date();
      const dayKey = DAY_KEYS[now.getDay()];
      const daySchedule = hours[dayKey];
      if (!daySchedule || daySchedule.enabled === false) {
        // Day is disabled — should be closed
        if (settings.is_open) {
          await supabase.from('establishment_settings').update({ is_open: false }).eq('id', settings.id);
          queryClient.invalidateQueries({ queryKey: ['establishment-settings'] });
        }
        return;
      }

      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [openH, openM] = (daySchedule.open || '18:00').split(':').map(Number);
      const [closeH, closeM] = (daySchedule.close || '23:00').split(':').map(Number);
      const openMinutes = openH * 60 + openM;
      let closeMinutes = closeH * 60 + closeM;

      // Handle overnight (e.g., 22:00 - 02:00)
      const isOvernight = closeMinutes <= openMinutes;
      let shouldBeOpen: boolean;

      if (isOvernight) {
        shouldBeOpen = currentMinutes >= openMinutes || currentMinutes < closeMinutes;
      } else {
        shouldBeOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
      }

      if (shouldBeOpen !== settings.is_open) {
        await supabase.from('establishment_settings').update({ is_open: shouldBeOpen }).eq('id', settings.id);
        queryClient.invalidateQueries({ queryKey: ['establishment-settings'] });
      }
    };

    check();
    intervalRef.current = setInterval(check, 60000); // check every minute

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [settings, queryClient]);
}

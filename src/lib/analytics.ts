import { supabase } from '@/integrations/supabase/client';

const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export async function trackEvent(eventType: string, metadata?: Record<string, unknown>) {
  try {
    // Use rpc-style insert since analytics_events may not be in generated types yet
    const { error } = await (supabase as any).from('analytics_events').insert({
      event_type: eventType,
      session_id: sessionId,
      metadata: metadata || {},
    });
    if (error) console.debug('Analytics insert error:', error);
  } catch {
    // Silent fail for analytics
  }
}

export const AnalyticsEvents = {
  MENU_VIEW: 'menu_view',
  CATEGORY_CLICK: 'category_click',
  PRODUCT_VIEW: 'product_view',
  ADD_TO_CART: 'add_to_cart',
  CART_OPEN: 'cart_open',
  CHECKOUT_START: 'checkout_start',
  ORDER_COMPLETE: 'order_complete',
  COUPON_APPLIED: 'coupon_applied',
  LOYALTY_USED: 'loyalty_used',
} as const;

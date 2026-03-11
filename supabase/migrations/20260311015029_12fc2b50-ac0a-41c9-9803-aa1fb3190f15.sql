-- WhatsApp conversation history for context
CREATE TABLE public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  message text NOT NULL,
  message_type text NOT NULL DEFAULT 'text',
  wa_message_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_whatsapp_messages_phone ON public.whatsapp_messages(phone);
CREATE INDEX idx_whatsapp_messages_created ON public.whatsapp_messages(created_at DESC);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view whatsapp messages"
  ON public.whatsapp_messages FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Service can insert whatsapp messages"
  ON public.whatsapp_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Enable realtime for whatsapp messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
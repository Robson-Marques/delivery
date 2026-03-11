
CREATE TABLE public.whatsapp_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token text NOT NULL DEFAULT '',
  phone_number_id text NOT NULL DEFAULT '',
  verify_token text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage whatsapp config"
ON public.whatsapp_config
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Insert default row
INSERT INTO public.whatsapp_config (access_token, phone_number_id, verify_token) VALUES ('', '', '');

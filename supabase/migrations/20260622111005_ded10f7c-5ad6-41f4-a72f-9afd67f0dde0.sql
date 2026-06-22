
-- Add parent role to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'parent';

-- Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS institution text,
  ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS goals text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS invite_code text UNIQUE;

-- Generate invite code function + backfill
CREATE OR REPLACE FUNCTION public.gen_invite_code()
RETURNS text LANGUAGE sql VOLATILE AS $$
  SELECT upper(substring(md5(random()::text || clock_timestamp()::text) for 8));
$$;

CREATE OR REPLACE FUNCTION public.set_invite_code()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code := public.gen_invite_code();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_set_invite_code ON public.profiles;
CREATE TRIGGER profiles_set_invite_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_invite_code();

UPDATE public.profiles SET invite_code = public.gen_invite_code() WHERE invite_code IS NULL;

-- Parent-child links
CREATE TABLE IF NOT EXISTS public.parent_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, student_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.parent_links TO authenticated;
GRANT ALL ON public.parent_links TO service_role;
ALTER TABLE public.parent_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents read own links" ON public.parent_links
  FOR SELECT TO authenticated USING (auth.uid() = parent_id OR auth.uid() = student_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Parents create own links" ON public.parent_links
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "Parents delete own links" ON public.parent_links
  FOR DELETE TO authenticated USING (auth.uid() = parent_id);

-- RPC: link a student to current parent by invite code
CREATE OR REPLACE FUNCTION public.link_student_by_code(_code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _student uuid;
BEGIN
  SELECT id INTO _student FROM public.profiles WHERE invite_code = upper(_code) LIMIT 1;
  IF _student IS NULL THEN RAISE EXCEPTION 'Invalid invite code'; END IF;
  IF _student = auth.uid() THEN RAISE EXCEPTION 'Cannot link to yourself'; END IF;
  INSERT INTO public.parent_links (parent_id, student_id) VALUES (auth.uid(), _student)
    ON CONFLICT (parent_id, student_id) DO NOTHING;
  RETURN _student;
END $$;

-- AI conversations
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New chat',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversations TO authenticated;
GRANT ALL ON public.ai_conversations TO service_role;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage conversations" ON public.ai_conversations
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_messages_conversation_idx ON public.ai_messages(conversation_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_messages TO authenticated;
GRANT ALL ON public.ai_messages TO service_role;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage messages" ON public.ai_messages
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));


-- 1) Update handle_new_user to recognize the new super-admin email
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _is_admin boolean := lower(NEW.email) IN ('admin@edupulse.app','ajibadei75@gmail.com');
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, approval_status, approved_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE WHEN _is_admin THEN 'approved' ELSE 'pending' END,
    CASE WHEN _is_admin THEN now() ELSE NULL END
  );

  IF _is_admin THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin')
      ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
      ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student')
      ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END $function$;

-- 2) Seed the auth user with a temporary password if it does not already exist
DO $$
DECLARE _uid uuid;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE lower(email) = 'ajibadei75@gmail.com' LIMIT 1;
  IF _uid IS NULL THEN
    _uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', _uid, 'authenticated', 'authenticated',
      'ajibadei75@gmail.com', crypt('EduPulse#2026', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"EduPulse Owner"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), _uid, jsonb_build_object('sub', _uid::text, 'email', 'ajibadei75@gmail.com'), 'email', _uid::text, now(), now(), now());
  END IF;

  -- Ensure profile + roles exist even if signup trigger was bypassed
  INSERT INTO public.profiles (id, full_name, approval_status, approved_at)
    VALUES (_uid, 'EduPulse Owner', 'approved', now())
    ON CONFLICT (id) DO UPDATE SET approval_status = 'approved', approved_at = COALESCE(public.profiles.approved_at, now());
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'super_admin') ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'admin') ON CONFLICT DO NOTHING;
END $$;

ALTER TABLE public.candidatos ADD COLUMN IF NOT EXISTS prazo_estendido timestamptz;

INSERT INTO public.candidatos (email, nome, senha_hash, prazo_estendido)
VALUES ('giovannadefourny@gmail.com', 'Giovanna Defourny', '07d04fa531afe27abdd35818b6baca8e813181e384ef3e17cb726cb7b4f8d840', '2026-10-05T02:59:00Z')
ON CONFLICT (email) DO UPDATE SET senha_hash = EXCLUDED.senha_hash, prazo_estendido = EXCLUDED.prazo_estendido;

CREATE OR REPLACE FUNCTION public.meu_prazo()
RETURNS timestamptz
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT GREATEST('2026-09-21T02:59:00Z'::timestamptz,
    COALESCE((SELECT c.prazo_estendido FROM public.candidatos c
              WHERE lower(c.email) = lower(auth.jwt() ->> 'email')), '2026-09-21T02:59:00Z'::timestamptz))
$$;
REVOKE ALL ON FUNCTION public.meu_prazo() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.meu_prazo() TO authenticated;

DROP POLICY IF EXISTS "candidato cria a propria entrega" ON public.entregas;
DROP POLICY IF EXISTS "candidato edita a propria entrega ate o prazo" ON public.entregas;
CREATE POLICY "candidato cria a propria entrega" ON public.entregas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND now() < public.meu_prazo());
CREATE POLICY "candidato edita a propria entrega ate o prazo" ON public.entregas FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND now() < public.meu_prazo())
  WITH CHECK (auth.uid() = user_id AND now() < public.meu_prazo());
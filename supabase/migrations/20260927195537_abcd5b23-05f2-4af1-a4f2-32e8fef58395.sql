CREATE SCHEMA IF NOT EXISTS privado;
GRANT USAGE ON SCHEMA privado TO authenticated;
CREATE OR REPLACE FUNCTION privado.meu_prazo()
RETURNS timestamptz
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT GREATEST('2026-09-21T02:59:00Z'::timestamptz,
    COALESCE((SELECT c.prazo_estendido FROM public.candidatos c
              WHERE lower(c.email) = lower(auth.jwt() ->> 'email')), '2026-09-21T02:59:00Z'::timestamptz))
$$;
REVOKE ALL ON FUNCTION privado.meu_prazo() FROM public, anon;
GRANT EXECUTE ON FUNCTION privado.meu_prazo() TO authenticated;

DROP POLICY IF EXISTS "candidato cria a propria entrega" ON public.entregas;
DROP POLICY IF EXISTS "candidato edita a propria entrega ate o prazo" ON public.entregas;
CREATE POLICY "candidato cria a propria entrega" ON public.entregas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND now() < privado.meu_prazo());
CREATE POLICY "candidato edita a propria entrega ate o prazo" ON public.entregas FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND now() < privado.meu_prazo())
  WITH CHECK (auth.uid() = user_id AND now() < privado.meu_prazo());
DROP FUNCTION public.meu_prazo();
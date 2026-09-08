DROP POLICY IF EXISTS "candidato edita a propria entrega ate o prazo" ON public.entregas;
CREATE POLICY "candidato edita a propria entrega ate o prazo"
ON public.entregas FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND now() < timestamptz '2026-09-21 02:59:00+00')
WITH CHECK (auth.uid() = user_id AND now() < timestamptz '2026-09-21 02:59:00+00');

DROP POLICY IF EXISTS "candidato cria a propria entrega" ON public.entregas;
CREATE POLICY "candidato cria a propria entrega"
ON public.entregas FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND now() < timestamptz '2026-09-21 02:59:00+00');
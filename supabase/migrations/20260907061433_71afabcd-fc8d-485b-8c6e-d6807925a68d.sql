CREATE TABLE public.candidatos (
  email text PRIMARY KEY,
  senha_inicial text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.candidatos TO service_role;
ALTER TABLE public.candidatos ENABLE ROW LEVEL SECURITY;

-- Lista de aprovados removida do código-fonte por segurança.
-- As senhas iniciais nunca devem ser gravadas aqui em texto puro:
-- a coluna senha_hash guarda apenas o SHA-256 da senha.

CREATE TABLE public.entregas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  q1 text NOT NULL DEFAULT '',
  q2 text NOT NULL DEFAULT '',
  q3 text NOT NULL DEFAULT '',
  q4 text NOT NULL DEFAULT '',
  q5 text NOT NULL DEFAULT '',
  usou_ia boolean,
  ia_detalhes text NOT NULL DEFAULT '',
  link_complementar text NOT NULL DEFAULT '',
  arquivo_path text,
  arquivo_nome text,
  finalizada boolean NOT NULL DEFAULT false,
  enviada_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.entregas TO authenticated;
GRANT ALL ON public.entregas TO service_role;
ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "candidato ve a propria entrega" ON public.entregas
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "candidato cria a propria entrega" ON public.entregas
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "candidato edita a propria entrega ate o prazo" ON public.entregas
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND now() < timestamptz '2026-09-15 02:59:00+00')
  WITH CHECK (auth.uid() = user_id AND now() < timestamptz '2026-09-15 02:59:00+00');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER entregas_updated_at BEFORE UPDATE ON public.entregas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
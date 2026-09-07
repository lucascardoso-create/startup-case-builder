CREATE TABLE public.candidatos (
  email text PRIMARY KEY,
  senha_inicial text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.candidatos TO service_role;
ALTER TABLE public.candidatos ENABLE ROW LEVEL SECURITY;

INSERT INTO public.candidatos (email, senha_inicial) VALUES
  ('bryanimperial@usp.br','ilab-zdclbxh8'),
  ('paulodasilva7920@usp.br','ilab-kvsjzeio'),
  ('augustopiovesan04@gmail.com','ilab-k1go5spq'),
  ('10743373@mackenzista.com.br','ilab-4nwq4jp3'),
  ('igorc1505@gmail.com','ilab-dlbdvfyk'),
  ('eduardo.frazao@usp.br','ilab-ttzwp1rq'),
  ('arthurbragio@usp.br','ilab-7nm9d50y'),
  ('gamarinhosilva@gmail.com','ilab-6bhem583'),
  ('renatobevi@gmail.com','ilab-bhub581v'),
  ('mperfettovieira@gmail.com','ilab-x9dnc7v0'),
  ('othiagosobral@gmail.com','ilab-yuzee4so'),
  ('cjuliao@usp.br','ilab-tbj6160s'),
  ('biancaagatagarcia@gmail.com','ilab-yp69iuaq'),
  ('luizaugusto2007@usp.br','ilab-vjm4z7o9'),
  ('lucasspalves.la@gmail.com','ilab-lkhuruj0'),
  ('pcbatistta@gmail.com','ilab-z0dvwf8l'),
  ('lucascdiegues@usp.br','ilab-c7j7kngx'),
  ('heliosnb@usp.br','ilab-218d9jer'),
  ('vlnoronha21@gmail.com','ilab-lgk8qgvp'),
  ('mercado.lucas@usp.br','ilab-6trqcisv'),
  ('lucascardososilva@usp.br','ilab-admin2026');

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
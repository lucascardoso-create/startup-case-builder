CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.candidatos RENAME COLUMN senha_inicial TO senha_hash;

UPDATE public.candidatos
SET senha_hash = encode(extensions.digest(senha_hash, 'sha256'), 'hex')
WHERE senha_hash !~ '^[0-9a-f]{64}$';

COMMENT ON COLUMN public.candidatos.senha_hash IS 'SHA-256 hex da senha inicial. Nunca armazenar a senha em texto puro.';

CREATE POLICY "ninguem le a lista de aprovados" ON public.candidatos
  FOR SELECT TO authenticated, anon USING (false);
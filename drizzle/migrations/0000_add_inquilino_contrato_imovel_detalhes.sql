ALTER TABLE public.inquilinos
  ADD COLUMN IF NOT EXISTS valor_caucao numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contrato_url text,
  ADD COLUMN IF NOT EXISTS contrato_nome text;

ALTER TABLE public.imoveis
  ADD COLUMN IF NOT EXISTS dormitorios integer,
  ADD COLUMN IF NOT EXISTS metragem numeric,
  ADD COLUMN IF NOT EXISTS fotos jsonb NOT NULL DEFAULT '[]'::jsonb;

NOTIFY pgrst, 'reload schema';
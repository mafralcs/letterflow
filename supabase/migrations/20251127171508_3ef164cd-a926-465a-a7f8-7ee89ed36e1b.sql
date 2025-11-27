-- Criar bucket de storage para logos de projetos
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-logos', 'project-logos', true);

-- RLS policies para o bucket project-logos
CREATE POLICY "Users can view all project logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-logos');

CREATE POLICY "Users can upload their own project logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own project logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'project-logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own project logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Adicionar novos campos na tabela projects
ALTER TABLE public.projects
ADD COLUMN logo_url text,
ADD COLUMN newsletter_type text NOT NULL DEFAULT 'personal';

-- Comentários para documentação
COMMENT ON COLUMN public.projects.logo_url IS 'URL do logo da empresa/projeto (opcional)';
COMMENT ON COLUMN public.projects.newsletter_type IS 'Tipo de newsletter: personal (pessoal) ou institutional (institucional)';
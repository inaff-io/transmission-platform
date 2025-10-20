-- ====================================
-- SQL para criar tabelas LINKS e ABAS
-- Execute este SQL no Supabase Dashboard
-- ====================================
-- Acesse: https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/sql/new
-- Cole todo este conteúdo e clique em "Run"
-- ====================================

-- Criar tabela LINKS
CREATE TABLE IF NOT EXISTS public.links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT CHECK (tipo IN ('transmissao','programacao')),
  url TEXT NOT NULL,
  ativo_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para LINKS
CREATE INDEX IF NOT EXISTS idx_links_tipo ON public.links(tipo);
CREATE INDEX IF NOT EXISTS idx_links_ativo_em ON public.links(ativo_em DESC);
CREATE INDEX IF NOT EXISTS idx_links_atualizado_em ON public.links(atualizado_em DESC);

-- Comentários da tabela LINKS
COMMENT ON TABLE public.links IS 'Armazena URLs de transmissão e programação do evento';
COMMENT ON COLUMN public.links.tipo IS 'Tipo do link: transmissao (vídeo ao vivo) ou programacao (iframe)';
COMMENT ON COLUMN public.links.url IS 'URL completa (YouTube embed, Vimeo, etc)';
COMMENT ON COLUMN public.links.ativo_em IS 'Timestamp de quando o link foi ativado';
COMMENT ON COLUMN public.links.atualizado_em IS 'Última atualização do registro';

-- ====================================

-- Criar tabela ABAS
CREATE TABLE IF NOT EXISTS public.abas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  habilitada BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para ABAS
CREATE INDEX IF NOT EXISTS idx_abas_nome ON public.abas(nome);
CREATE INDEX IF NOT EXISTS idx_abas_habilitada ON public.abas(habilitada);

-- Comentários da tabela ABAS
COMMENT ON TABLE public.abas IS 'Controla quais abas/seções estão habilitadas na interface';
COMMENT ON COLUMN public.abas.nome IS 'Nome da aba (programacao, materiais, chat, qa)';
COMMENT ON COLUMN public.abas.habilitada IS 'Se TRUE, a aba aparece na interface do usuário';

-- ====================================

-- Inserir abas padrão
INSERT INTO public.abas (nome, habilitada) VALUES
  ('programacao', TRUE),
  ('materiais', FALSE),
  ('chat', FALSE),
  ('qa', FALSE)
ON CONFLICT (nome) DO NOTHING;

-- ====================================

-- Inserir link de transmissão de exemplo (YouTube)
INSERT INTO public.links (tipo, url) VALUES
  ('transmissao', 'https://www.youtube.com/embed/DtyBnYuAsJY')
ON CONFLICT DO NOTHING;

-- ====================================

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abas ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para LINKS
-- Admins podem fazer tudo
CREATE POLICY "Admin full access links"
  ON public.links
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Usuários autenticados podem ler
CREATE POLICY "Authenticated read links"
  ON public.links
  FOR SELECT
  TO authenticated
  USING (true);

-- Anônimos podem ler (para UI blocks públicos)
CREATE POLICY "Anon read links"
  ON public.links
  FOR SELECT
  TO anon
  USING (true);

-- ====================================

-- Políticas de acesso para ABAS
-- Admins podem fazer tudo
CREATE POLICY "Admin full access abas"
  ON public.abas
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Usuários autenticados podem ler
CREATE POLICY "Authenticated read abas"
  ON public.abas
  FOR SELECT
  TO authenticated
  USING (true);

-- Anônimos podem ler (para UI blocks públicos)
CREATE POLICY "Anon read abas"
  ON public.abas
  FOR SELECT
  TO anon
  USING (true);

-- ====================================

-- Verificar tabelas criadas
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN ('usuarios', 'logins', 'links', 'abas')
ORDER BY table_name;

-- ====================================
-- ✅ PRONTO! Tabelas criadas com sucesso
-- ====================================

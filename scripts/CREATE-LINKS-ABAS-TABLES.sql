-- ═══════════════════════════════════════════════════════════════
-- CRIAÇÃO DAS TABELAS: links e abas
-- ═══════════════════════════════════════════════════════════════
-- Projeto: transmission-platform
-- Data: 20 de Outubro de 2025
-- 
-- Execute este SQL no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/sql/new
-- ═══════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────
-- 1. TABELA: links
-- ────────────────────────────────────────────────────────────────
-- Armazena URLs de transmissão e programação do evento
-- Tipos: 'transmissao', 'programacao', 'reprise'

CREATE TABLE IF NOT EXISTS public.links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('transmissao', 'programacao', 'reprise')),
    url TEXT NOT NULL,
    ativo_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para buscar links ativos por tipo
CREATE INDEX IF NOT EXISTS idx_links_tipo ON public.links(tipo);
CREATE INDEX IF NOT EXISTS idx_links_ativo_em ON public.links(ativo_em DESC);

-- Comentários
COMMENT ON TABLE public.links IS 'Armazena links de transmissão, programação e reprises do evento';
COMMENT ON COLUMN public.links.tipo IS 'Tipo do link: transmissao, programacao ou reprise';
COMMENT ON COLUMN public.links.url IS 'URL ou código HTML do iframe';
COMMENT ON COLUMN public.links.ativo_em IS 'Timestamp de quando o link foi ativado';

-- ────────────────────────────────────────────────────────────────
-- 2. TABELA: abas
-- ────────────────────────────────────────────────────────────────
-- Controla visibilidade de abas/seções na interface (chat, programação)

CREATE TABLE IF NOT EXISTS public.abas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE CHECK (nome IN ('chat', 'programacao', 'materiais', 'perguntas')),
    visivel BOOLEAN DEFAULT true NOT NULL,
    ordem INTEGER DEFAULT 0,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para ordenação
CREATE INDEX IF NOT EXISTS idx_abas_ordem ON public.abas(ordem);
CREATE INDEX IF NOT EXISTS idx_abas_visivel ON public.abas(visivel);

-- Comentários
COMMENT ON TABLE public.abas IS 'Controla visibilidade e ordem das abas na interface do usuário';
COMMENT ON COLUMN public.abas.nome IS 'Nome da aba: chat, programacao, materiais ou perguntas';
COMMENT ON COLUMN public.abas.visivel IS 'Se a aba está visível para os usuários';
COMMENT ON COLUMN public.abas.ordem IS 'Ordem de exibição das abas (menor = primeiro)';

-- ────────────────────────────────────────────────────────────────
-- 3. DADOS INICIAIS
-- ────────────────────────────────────────────────────────────────

-- Insere abas padrão se não existirem
INSERT INTO public.abas (nome, visivel, ordem) VALUES
    ('chat', true, 1),
    ('programacao', true, 2),
    ('materiais', false, 3),
    ('perguntas', false, 4)
ON CONFLICT (nome) DO NOTHING;

-- ────────────────────────────────────────────────────────────────
-- 4. POLÍTICAS DE SEGURANÇA (RLS)
-- ────────────────────────────────────────────────────────────────

-- Habilita RLS
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abas ENABLE ROW LEVEL SECURITY;

-- Política: Leitura pública (SELECT)
CREATE POLICY "Permitir leitura pública de links"
    ON public.links FOR SELECT
    USING (true);

CREATE POLICY "Permitir leitura pública de abas"
    ON public.abas FOR SELECT
    USING (true);

-- Política: Apenas autenticados podem modificar (INSERT, UPDATE, DELETE)
-- Você pode refinar isso para permitir apenas admins

CREATE POLICY "Apenas autenticados podem inserir links"
    ON public.links FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Apenas autenticados podem atualizar links"
    ON public.links FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas autenticados podem deletar links"
    ON public.links FOR DELETE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas autenticados podem inserir abas"
    ON public.abas FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Apenas autenticados podem atualizar abas"
    ON public.abas FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas autenticados podem deletar abas"
    ON public.abas FOR DELETE
    USING (auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────────
-- 5. TRIGGERS PARA ATUALIZAR updated_at
-- ────────────────────────────────────────────────────────────────

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para links
DROP TRIGGER IF EXISTS update_links_updated_at ON public.links;
CREATE TRIGGER update_links_updated_at
    BEFORE UPDATE ON public.links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para abas
DROP TRIGGER IF EXISTS update_abas_updated_at ON public.abas;
CREATE TRIGGER update_abas_updated_at
    BEFORE UPDATE ON public.abas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ────────────────────────────────────────────────────────────────
-- 6. GRANTS (Permissões)
-- ────────────────────────────────────────────────────────────────

-- Permite acesso anônimo para leitura
GRANT SELECT ON public.links TO anon;
GRANT SELECT ON public.abas TO anon;

-- Permite acesso completo para usuários autenticados
GRANT ALL ON public.links TO authenticated;
GRANT ALL ON public.abas TO authenticated;

-- Permite acesso de uso das sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- ✅ TABELAS CRIADAS COM SUCESSO!
-- ═══════════════════════════════════════════════════════════════
-- 
-- Próximos passos:
-- 1. Execute este SQL no Supabase SQL Editor
-- 2. Verifique se as tabelas foram criadas: node scripts/check-all-tables.mjs
-- 3. Recarregue o cache do Supabase:
--    https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/api
--    (clique em "Reload Schema")
-- 4. Reinicie o servidor: npm run dev
-- 
-- ═══════════════════════════════════════════════════════════════

-- Verifica se foi criado com sucesso
SELECT 
    'links' as tabela,
    COUNT(*) as total_colunas
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'links'
UNION ALL
SELECT 
    'abas' as tabela,
    COUNT(*) as total_colunas
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'abas';

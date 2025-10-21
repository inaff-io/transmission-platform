-- =========================================
-- Correção da Constraint da Tabela Links
-- Adiciona suporte ao tipo 'traducao'
-- =========================================

-- 1. Verificar constraints atuais
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE conrelid = 'links'::regclass
  AND contype = 'c'
ORDER BY conname;

-- 2. Remover constraint antiga
ALTER TABLE links DROP CONSTRAINT IF EXISTS links_tipo_check;

-- 3. Criar nova constraint com suporte a 'traducao'
ALTER TABLE links 
ADD CONSTRAINT links_tipo_check 
CHECK (tipo IN ('transmissao', 'programacao', 'traducao'));

-- 4. Verificar nova constraint
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE conrelid = 'links'::regclass
  AND contype = 'c'
ORDER BY conname;

-- 5. Inserir link de tradução (se ainda não existir)
INSERT INTO links (tipo, url, ativo_em, atualizado_em)
VALUES (
  'traducao',
  'https://www.snapsight.com/live-channel/l/93a696ad-92ee-436e-850a-68a971f9bf50/attendee/locations?lid=all',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- 6. Verificar todos os links
SELECT 
  id, 
  tipo, 
  LEFT(url, 80) as url_preview, 
  ativo_em, 
  atualizado_em
FROM links
ORDER BY tipo, atualizado_em DESC;

-- ================================================================================
-- SCRIPT PARA ADICIONAR USUÁRIO ENSINO@INAFF.ORG.BR E CORRIGIR ESTRUTURA
-- Execute este SQL no Supabase Dashboard SQL Editor
-- ================================================================================
-- URL: https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/sql/new
-- ================================================================================

-- 1. REMOVER CONSTRAINT DE FOREIGN KEY (permite login funcionar sem problemas)
ALTER TABLE IF EXISTS public.logins 
  DROP CONSTRAINT IF EXISTS logins_usuario_id_fkey CASCADE;

-- ================================================================================
-- 2. ADICIONAR/ATUALIZAR USUÁRIOS COM IDS CORRETOS
-- ================================================================================

-- Inserir ou atualizar usuário ensino@inaff.org.br
INSERT INTO public.usuarios (id, email, nome, cpf, categoria, status, created_at, updated_at) 
VALUES (
  '00127e3c-51e0-49df-9a7e-180fc921f08c'::uuid,
  'ensino@inaff.org.br',
  'JULIANA FERREIRA FERNANDES MACHADO',
  '00000000001',
  'user',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  status = true,
  updated_at = NOW();

-- Inserir ou atualizar usuário admin pecosta26@gmail.com
INSERT INTO public.usuarios (id, email, nome, cpf, categoria, status, created_at, updated_at) 
VALUES (
  '501c2b29-4148-4103-b256-b9fc8dfd3a31'::uuid,
  'pecosta26@gmail.com',
  'Pedro Costa',
  '00000000002',
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  status = true,
  updated_at = NOW();

-- Também atualizar o admin existente se tiver ID diferente
UPDATE public.usuarios 
SET 
  id = '501c2b29-4148-4103-b256-b9fc8dfd3a31'::uuid,
  updated_at = NOW()
WHERE email = 'pecosta26@gmail.com' 
  AND id != '501c2b29-4148-4103-b256-b9fc8dfd3a31'::uuid;

-- ================================================================================
-- 3. POPULAR TABELA ABAS
-- ================================================================================

INSERT INTO public.abas (nome, habilitada, criado_em, atualizado_em) VALUES
  ('programacao', true, NOW(), NOW()),
  ('materiais', false, NOW(), NOW()),
  ('chat', false, NOW(), NOW()),
  ('qa', false, NOW(), NOW())
ON CONFLICT (nome) DO UPDATE SET
  habilitada = EXCLUDED.habilitada,
  atualizado_em = NOW();

-- ================================================================================
-- 4. POPULAR TABELA LINKS
-- ================================================================================

-- Inserir link de transmissão de exemplo se não existir
INSERT INTO public.links (tipo, url, ativo_em, atualizado_em, created_at, updated_at) 
SELECT 
  'transmissao',
  'https://www.youtube.com/embed/DtyBnYuAsJY',
  NOW(),
  NOW(),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.links WHERE tipo = 'transmissao'
);

-- ================================================================================
-- 5. VERIFICAR RESULTADOS
-- ================================================================================

SELECT '=== USUÁRIOS ===' as info;
SELECT id, email, nome, categoria, status FROM public.usuarios ORDER BY categoria, email;

SELECT '' as blank_line;
SELECT '=== ABAS ===' as info;
SELECT id, nome, habilitada FROM public.abas ORDER BY nome;

SELECT '' as blank_line;
SELECT '=== LINKS ===' as info;
SELECT id, tipo, LEFT(url, 50) as url_preview FROM public.links ORDER BY tipo;

SELECT '' as blank_line;
SELECT '=== LOGINS RECENTES ===' as info;
SELECT id, usuario_id, ip, LEFT(navegador, 30) as navegador, created_at 
FROM public.logins 
ORDER BY created_at DESC 
LIMIT 5;

-- ================================================================================
-- ✅ PRONTO! Estrutura corrigida!
-- ================================================================================
-- Próximos passos:
-- 1. Resetar cache do Supabase: https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/api
-- 2. Reiniciar servidor: npm run dev
-- 3. Testar login com ensino@inaff.org.br
-- ================================================================================

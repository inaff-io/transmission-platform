-- ================================================================================
-- SCRIPT COMPLETO PARA CORRIGIR O BANCO DE DADOS
-- Execute este SQL inteiro no Supabase Dashboard SQL Editor
-- ================================================================================
-- URL: https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/sql/new
-- ================================================================================

-- 1. REMOVER CONSTRAINT DE FOREIGN KEY DA TABELA LOGINS
-- Isso permite que login funcione mesmo se o usuário não estiver na tabela usuarios
ALTER TABLE IF EXISTS public.logins 
  DROP CONSTRAINT IF EXISTS logins_usuario_id_fkey CASCADE;

COMMENT ON TABLE public.logins IS 'Registro de logins sem constraint rígida de FK';

-- ================================================================================

-- 2. LIMPAR E RECRIAR TABELA USUARIOS COM OS USUÁRIOS CORRETOS
-- Backup dos usuários existentes (opcional)
-- CREATE TABLE usuarios_backup AS SELECT * FROM usuarios;

-- Limpar usuários antigos
DELETE FROM public.usuarios;

-- Inserir os usuários corretos com os IDs que estão sendo usados na autenticação
INSERT INTO public.usuarios (id, email, nome, cpf, categoria, status, created_at, updated_at) VALUES
  (
    '00127e3c-51e0-49df-9a7e-180fc921f08c'::uuid,
    'ensino@inaff.org.br',
    'JULIANA FERREIRA FERNANDES MACHADO',
    '00000000001',
    'user',
    true,
    NOW(),
    NOW()
  ),
  (
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
  updated_at = NOW();

-- ================================================================================

-- 3. POPULAR TABELA ABAS
DELETE FROM public.abas;

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
DELETE FROM public.links WHERE tipo = 'transmissao';

INSERT INTO public.links (tipo, url, ativo_em, atualizado_em, created_at, updated_at) VALUES
  (
    'transmissao',
    'https://www.youtube.com/embed/DtyBnYuAsJY',
    NOW(),
    NOW(),
    NOW(),
    NOW()
  );

-- ================================================================================

-- 5. VERIFICAR RESULTADOS
SELECT '=== USUÁRIOS ===' as tabela;
SELECT id, email, nome, categoria FROM public.usuarios ORDER BY categoria, email;

SELECT '=== ABAS ===' as tabela;
SELECT id, nome, habilitada FROM public.abas ORDER BY nome;

SELECT '=== LINKS ===' as tabela;
SELECT id, tipo, url FROM public.links ORDER BY tipo;

SELECT '=== LOGINS (últimos 10) ===' as tabela;
SELECT id, usuario_id, ip, navegador, created_at 
FROM public.logins 
ORDER BY created_at DESC 
LIMIT 10;

-- ================================================================================
-- ✅ PRONTO! Banco de dados corrigido!
-- ================================================================================
-- Agora reinicie o servidor Next.js: npm run dev
-- ================================================================================

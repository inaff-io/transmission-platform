-- Migração: Adiciona coluna 'ativo' na tabela usuarios
-- Data: 2025-10-20
-- Motivo: Campo usado no código mas não existe no schema do Supabase

-- Adiciona coluna ativo (default true para novos usuários)
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true;

-- Atualiza usuários existentes para ativo = true
UPDATE usuarios 
SET ativo = true 
WHERE ativo IS NULL;

-- Adiciona NOT NULL constraint após preencher valores
ALTER TABLE usuarios 
ALTER COLUMN ativo SET NOT NULL;

-- Verifica resultado
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(*) FILTER (WHERE ativo = true) as usuarios_ativos,
    COUNT(*) FILTER (WHERE ativo = false) as usuarios_inativos
FROM usuarios;

-- Mostra primeiros 5 usuários para validar
SELECT id, nome, email, status, ativo, created_at
FROM usuarios
ORDER BY created_at DESC
LIMIT 5;

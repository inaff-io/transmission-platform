-- Script SQL: Criar Usuário de Teste para Chat
-- Execute no SQL Editor do Supabase

-- Deleta se já existir (para recriar)
DELETE FROM usuarios WHERE email = 'usuario.teste@example.com';

-- Cria o usuário
INSERT INTO usuarios (
  id,
  nome,
  email,
  cpf,
  categoria,
  status,
  created_at,
  updated_at
) VALUES (
  'usuario_teste_chat',
  'Usuário Teste Chat',
  'usuario.teste@example.com',
  '99988877766',
  'user',
  true,
  NOW(),
  NOW()
);

-- Verifica se foi criado
SELECT * FROM usuarios WHERE email = 'usuario.teste@example.com';

-- Insere usuário comum de teste
INSERT INTO usuarios (
  nome,
  email,
  cpf,
  categoria,
  status,
  created_at,
  updated_at
)
VALUES (
  'João Silva',
  'joao.silva.test@example.com',
  '11122233344',
  'user',
  true,
  NOW(),
  NOW()
);

-- Insere usuário admin de teste
INSERT INTO usuarios (
  nome,
  email,
  cpf,
  categoria,
  status,
  created_at,
  updated_at
)
VALUES (
  'Administrador',
  'admin.test@example.com',
  '55566677788',
  'admin',
  true,
  NOW(),
  NOW()
);
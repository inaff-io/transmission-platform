INSERT INTO public.usuarios (
  id,
  nome,
  email,
  cpf,
  status,
  created_at,
  updated_at
)
VALUES 
  (
    gen_random_uuid(),
    'Pedro Costa',
    'pecosta26@gmail.com',
    '05701807401',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid(),
    'João Silva',
    'joao.silva@gmail.com',
    '12345678900',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

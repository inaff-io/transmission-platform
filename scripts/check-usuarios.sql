-- Verifica se a tabela usuarios existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'usuarios'
) as table_exists;

-- Conta o número total de registros
SELECT COUNT(*) as total_records FROM public.usuarios;

-- Mostra os 5 registros mais recentes
SELECT 
  id,
  nome,
  email,
  cpf,
  categoria,
  created_at,
  updated_at
FROM public.usuarios
ORDER BY created_at DESC
LIMIT 5;
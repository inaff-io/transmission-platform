-- Verifica se a tabela logins existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'logins'
) as table_exists;

-- Conta o número total de registros
SELECT COUNT(*) as total_records FROM public.logins;

-- Mostra os 5 registros mais recentes com informações do usuário
SELECT 
  l.id,
  l.login_em,
  l.logout_em,
  l.tempo_logado,
  l.ip,
  l.navegador,
  u.nome as usuario_nome,
  u.email as usuario_email,
  u.categoria as usuario_categoria
FROM public.logins l
LEFT JOIN public.usuarios u ON l.usuario_id = u.id
ORDER BY l.login_em DESC
LIMIT 5;
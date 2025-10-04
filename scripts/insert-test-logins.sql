-- Insere dados de teste na tabela logins para os últimos 7 dias
WITH user_ids AS (
  SELECT id, email FROM usuarios WHERE email IN ('joao.silva@example.com', 'pedro.costa@example.com')
)
INSERT INTO logins (
  id,
  usuario_id,
  login_em,
  logout_em,
  tempo_logado,
  ip,
  navegador,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  u.id,
  -- Gera timestamps aleatórios nos últimos 7 dias
  NOW() - (random() * interval '7 days') as login_em,
  -- Alguns registros terão logout, outros não
  CASE 
    WHEN random() > 0.2 THEN 
      NOW() - (random() * interval '7 days')
    ELSE NULL 
  END as logout_em,
  -- Tempo logado entre 1 minuto e 3 horas (em segundos)
  floor(random() * (10800 - 60 + 1) + 60)::integer as tempo_logado,
  -- IPs de exemplo
  '192.168.' || 
  (floor(random() * 255))::text || '.' ||
  (floor(random() * 255))::text as ip,
  -- Navegadores de exemplo
  CASE floor(random() * 4)
    WHEN 0 THEN 'Chrome/122.0.0.0'
    WHEN 1 THEN 'Firefox/123.0'
    WHEN 2 THEN 'Safari/17.3.1'
    ELSE 'Edge/122.0.2365.66'
  END as navegador,
  NOW() as created_at,
  NOW() as updated_at
FROM 
  user_ids u
CROSS JOIN 
  generate_series(1, 10); -- 10 registros por usuário
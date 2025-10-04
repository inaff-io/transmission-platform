-- Testa inserção com service_role
DO $$
BEGIN
    RAISE NOTICE 'Testando inserção com service_role...';
    
    INSERT INTO usuarios (nome, email, cpf, status)
    VALUES ('Usuário Teste', 'teste@teste.com', '12345678901', 'ativo');
    
    RAISE NOTICE 'Inserção bem sucedida!';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro na inserção: %', SQLERRM;
END $$;

-- Testa leitura com anon (simulando login)
DO $$
DECLARE
    v_count integer;
BEGIN
    RAISE NOTICE 'Testando leitura anônima (login)...';
    
    SELECT COUNT(*) INTO v_count
    FROM usuarios
    WHERE email = 'teste@teste.com';
    
    RAISE NOTICE 'Contagem de registros encontrados: %', v_count;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro na leitura anônima: %', SQLERRM;
END $$;

-- Testa leitura com authenticated
DO $$
DECLARE
    v_count integer;
BEGIN
    RAISE NOTICE 'Testando leitura autenticada...';
    
    SELECT COUNT(*) INTO v_count
    FROM usuarios;
    
    RAISE NOTICE 'Total de usuários visíveis: %', v_count;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro na leitura autenticada: %', SQLERRM;
END $$;

-- Lista todas as políticas ativas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'usuarios';

-- Verifica as permissões atuais
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'usuarios'
    AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- Limpa o usuário de teste
DELETE FROM usuarios WHERE email = 'teste@teste.com';

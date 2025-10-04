-- Verifica as permissões atuais
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name = 'usuarios';

-- Verifica as políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'usuarios';

-- Verifica se RLS está habilitado
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'usuarios'
AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Lista todos os roles e seus privilégios
SELECT 
    r.rolname, 
    r.rolsuper, 
    r.rolinherit,
    r.rolcreaterole,
    r.rolcreatedb,
    r.rolcanlogin,
    r.rolreplication,
    r.rolconnlimit,
    r.rolvaliduntil
FROM pg_roles r
WHERE r.rolname IN ('anon', 'authenticated', 'service_role')
ORDER BY r.rolname;

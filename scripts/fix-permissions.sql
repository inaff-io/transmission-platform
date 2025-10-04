-- Garante que estamos no schema correto e desabilita RLS temporariamente
SET search_path TO public;
ALTER TABLE IF EXISTS usuarios DISABLE ROW LEVEL SECURITY;

-- Revoga todas as permissões existentes para garantir um estado limpo
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON SCHEMA public FROM anon, authenticated;

-- Garante que o service_role tem todas as permissões necessárias
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT ALL ON SCHEMA public TO service_role;

-- Garante acesso ao schema public
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Permissões específicas para a tabela usuarios
GRANT SELECT, INSERT, UPDATE ON TABLE usuarios TO service_role;
GRANT SELECT ON TABLE usuarios TO authenticated;
GRANT SELECT ON TABLE usuarios TO anon;

-- Garante que o service_role pode gerenciar sequências
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Habilita RLS na tabela usuarios
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Remove políticas existentes para limpar
DROP POLICY IF EXISTS "Service can do anything" ON usuarios;
DROP POLICY IF EXISTS "Authenticated users can read" ON usuarios;
DROP POLICY IF EXISTS "Allow anonymous login check" ON usuarios;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON usuarios;

-- Política para service_role (acesso total)
CREATE POLICY "Service can do anything"
    ON usuarios
    AS PERMISSIVE
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Política para usuários autenticados (apenas leitura)
CREATE POLICY "Authenticated users can read"
    ON usuarios
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (true);

-- Política para login (permite leitura anônima)
CREATE POLICY "Allow anonymous login check"
    ON usuarios
    AS PERMISSIVE
    FOR SELECT
    TO anon
    USING (true);

-- Verifica se a tabela existe e suas permissões
DO $$
BEGIN
    RAISE NOTICE 'Checking table permissions...';
    
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios'
    ) THEN
        RAISE NOTICE 'Table usuarios exists';
    ELSE
        RAISE NOTICE 'Table usuarios does not exist';
    END IF;
END $$;

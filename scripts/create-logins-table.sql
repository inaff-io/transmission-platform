-- Criar tabela de logins
CREATE TABLE IF NOT EXISTS public.logins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id),
    login_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    logout_em TIMESTAMP WITH TIME ZONE,
    tempo_logado INTEGER, -- em segundos
    ip TEXT,
    navegador TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_logins_usuario_id ON public.logins(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logins_login_em ON public.logins(login_em);
CREATE INDEX IF NOT EXISTS idx_logins_logout_em ON public.logins(logout_em);

-- Garantir permissões
ALTER TABLE public.logins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_all ON public.logins;
DROP POLICY IF EXISTS user_select ON public.logins;

-- Políticas de segurança
CREATE POLICY admin_all ON public.logins
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.usuarios u
            WHERE u.id = auth.uid()
            AND u.categoria = 'admin'
        )
    );

CREATE POLICY user_select ON public.logins
    FOR SELECT
    TO authenticated
    USING (usuario_id = auth.uid());

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_logins_updated_at ON public.logins;

CREATE TRIGGER update_logins_updated_at
    BEFORE UPDATE ON public.logins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
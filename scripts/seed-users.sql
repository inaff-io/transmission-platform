-- Limpa registros existentes para garantir um estado consistente
TRUNCATE TABLE usuarios CASCADE;

-- Insere um usuário de teste
INSERT INTO usuarios (
    nome,
    email,
    cpf,
    status,
    categoria
) VALUES (
    'Admin',
    'admin@admin.com',
    '12345678901',
    'ativo',
    'admin'
);

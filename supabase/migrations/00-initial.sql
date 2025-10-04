-- Enable pgcrypto extension for UUID generation
create extension if not exists "pgcrypto";

-- Tabela de usuários
create table if not exists usuarios (
    id uuid primary key default gen_random_uuid(),
    categoria text not null,
    nome text not null,
    email text unique not null,
    cpf text unique not null,
    criado_em timestamp default now()
);

-- Tabela de logins
create table if not exists logins (
    id uuid primary key default gen_random_uuid(),
    usuario_id uuid references usuarios(id) on delete cascade,
    login_em timestamp default now(),
    logout_em timestamp,
    tempo_logado int,
    ip text,
    navegador text
);

-- Tabela de links
create table if not exists links (
    id uuid primary key default gen_random_uuid(),
    tipo text check (tipo in ('transmissao','programacao')),
    url text not null,
    ativo_em timestamp default now(),
    atualizado_em timestamp default now()
);

-- Tabela de abas adicionais
create table if not exists abas (
    id uuid primary key default gen_random_uuid(),
    nome text not null unique, -- Adicionando constraint UNIQUE
    habilitada boolean default false,
    criado_em timestamp default now(),
    atualizado_em timestamp default now()
);

-- Inserir abas padrão
insert into abas (nome, habilitada) values
    ('programacao', true),
    ('materiais', false),
    ('chat', false),
    ('qa', false)
on conflict (nome) do nothing;

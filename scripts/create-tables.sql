-- Enable pgcrypto extension for UUID generation
create extension if not exists "pgcrypto";

-- Drop existing tables in correct order
drop table if exists notificacoes;
drop table if exists sessoes;
drop table if exists historico_acessos;
drop table if exists chat;
drop table if exists perguntas;
drop table if exists materiais;
drop table if exists configuracoes;
drop table if exists transmissoes;
drop table if exists programacoes;
drop table if exists usuarios;

-- Create usuarios table
create table if not exists usuarios (
    id uuid primary key default gen_random_uuid(),
    categoria text not null default 'user',
    nome text not null,
    email text unique not null,
    cpf text unique not null,
    status boolean default true,
    last_active timestamp,
    created_at timestamp default now(),
    updated_at timestamp default now()
);

-- Create programacoes table
create table if not exists programacoes (
    id uuid primary key default gen_random_uuid(),
    titulo text not null,
    url_iframe text not null,
    ordem int not null,
    created_at timestamp default now(),
    updated_at timestamp default now()
);

-- Create transmissoes table
create table if not exists transmissoes (
    id uuid primary key default gen_random_uuid(),
    titulo text not null,
    vimeo_id text not null,
    status boolean default true,
    created_at timestamp default now(),
    updated_at timestamp default now()
);

-- Create configuracoes table
create table if not exists configuracoes (
    id uuid primary key default gen_random_uuid(),
    chave text unique not null,
    valor boolean default true,
    created_at timestamp default now(),
    updated_at timestamp default now()
);

-- Create materiais table
create table if not exists materiais (
    id uuid primary key default gen_random_uuid(),
    titulo text not null,
    url_pdf text not null,
    created_at timestamp default now(),
    updated_at timestamp default now()
);

-- Create perguntas table
create table if not exists perguntas (
    id uuid primary key default gen_random_uuid(),
    usuario_id uuid references usuarios(id),
    pergunta text not null,
    resposta text,
    status text default 'pendente',
    created_at timestamp default now(),
    updated_at timestamp default now()
);

-- Create chat table
create table if not exists chat (
    id uuid primary key default gen_random_uuid(),
    usuario_id uuid references usuarios(id),
    mensagem text not null,
    created_at timestamp default now(),
    updated_at timestamp default now()
);

-- Create historico_acessos table
create table if not exists historico_acessos (
    id uuid primary key default gen_random_uuid(),
    usuario_id uuid references usuarios(id),
    acao text not null,
    ip text,
    user_agent text,
    created_at timestamp default now()
);

-- Create sessoes table
create table if not exists sessoes (
    id uuid primary key default gen_random_uuid(),
    usuario_id uuid references usuarios(id),
    iniciada_em timestamp default now(),
    finalizada_em timestamp,
    duracao int
);

-- Create notificacoes table
create table if not exists notificacoes (
    id uuid primary key default gen_random_uuid(),
    usuario_id uuid references usuarios(id),
    tipo text not null,
    mensagem text not null,
    lida boolean default false,
    created_at timestamp default now()
);

-- Insert initial users
insert into usuarios (categoria, nome, email, cpf)
values 
    ('admin', 'Pedro Costa', 'pecosta26@gmail.com', '12345678901'),
    ('user', 'João Silva', 'joao.silva@example.com', '98765432101')
on conflict (email) do nothing;
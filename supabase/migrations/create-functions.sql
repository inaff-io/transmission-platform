-- Função para criar tabela de usuários
create or replace function create_usuarios_table()
returns void as $$
begin
  create table if not exists usuarios (
    id uuid primary key default gen_random_uuid(),
    categoria text not null,
    nome text not null,
    email text unique not null,
    cpf text unique not null,
    status boolean default true,
    last_active timestamp,
    created_at timestamp default now(),
    updated_at timestamp default now()
  );
end;
$$ language plpgsql;

-- Função para criar tabela de logins
create or replace function create_logins_table()
returns void as $$
begin
  create table if not exists logins (
    id uuid primary key default gen_random_uuid(),
    usuario_id uuid references usuarios(id) on delete cascade,
    login_em timestamp default now(),
    logout_em timestamp,
    tempo_logado int,
    ip text,
    navegador text
  );
end;
$$ language plpgsql;

-- Função para criar tabela de links
create or replace function create_links_table()
returns void as $$
begin
  create table if not exists links (
    id uuid primary key default gen_random_uuid(),
    tipo text check (tipo in ('transmissao','programacao')),
    url text not null,
    ativo_em timestamp default now(),
    atualizado_em timestamp default now()
  );
end;
$$ language plpgsql;

-- Função para criar tabela de abas
create or replace function create_abas_table()
returns void as $$
begin
  create table if not exists abas (
    id uuid primary key default gen_random_uuid(),
    nome text not null unique,
    habilitada boolean default false,
    criado_em timestamp default now(),
    atualizado_em timestamp default now()
  );
end;
$$ language plpgsql;
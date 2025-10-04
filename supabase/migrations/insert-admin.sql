-- Inserir usuário admin para teste
insert into usuarios (categoria, nome, email, cpf)
values ('Admin', 'Administrador', 'admin@example.com', '12345678900')
on conflict (email) do nothing;

-- Inserir usuário admin
insert into usuarios (categoria, nome, email, cpf)
values ('admin', 'Pedro Costa', 'pecosta26@gmail.com', '12345678901')
on conflict (email) do nothing;

-- Inserir usuário regular
insert into usuarios (categoria, nome, email, cpf)
values ('user', 'João Silva', 'joao.silva@example.com', '98765432101')
on conflict (email) do nothing;

-- Criar a tabela ui_blocks
create table if not exists public.ui_blocks (
  name text primary key,
  content text,
  updated_at timestamptz default now()
);

-- Inserir dados iniciais
insert into public.ui_blocks (name, content) values
  ('login_header', '<div style="padding:12px;text-align:center;">Cabeçalho do Login</div>'),
  ('login_footer', '<div style="padding:12px;text-align:center;font-size:12px;color:#666;">© 2025</div>'),
  ('transmissao_header', '<div style="padding:12px;text-align:center;">Cabeçalho da Transmissão</div>'),
  ('transmissao_footer', '<div style="padding:12px;text-align:center;font-size:12px;color:#666;">Rodapé</div>'),
  ('transmission_footer', '<div style="padding:12px;text-align:center;font-size:12px;color:#666;">Footer</div>')
on conflict (name) do nothing;
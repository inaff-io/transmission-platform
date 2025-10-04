-- Creates the table used to manage header/footer content
create table if not exists public.ui_blocks (
  key text primary key,
  html text,
  updated_at timestamptz default now()
);

-- Optional initial content (safe to run multiple times)
-- insert into public.ui_blocks(key, html) values
--   ('login_header', '<div style="padding:12px;text-align:center;">Cabeçalho do Login</div>'),
--   ('login_footer', '<div style="padding:12px;text-align:center;font-size:12px;color:#666;">© 2025</div>'),
--   ('transmissao_header', '<div style="padding:12px;text-align:center;">Cabeçalho da Transmissão</div>'),
--   ('transmissao_footer', '<div style="padding:12px;text-align:center;font-size:12px;color:#666;">Rodapé</div>')
-- on conflict (key) do nothing;

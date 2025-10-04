import { createAdminClient } from '../src/lib/supabase/admin.ts';

async function createUIBlocksTable() {
  try {
    const supabase = createAdminClient();

    // Criar a tabela ui_blocks
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql_query: `
        create table if not exists public.ui_blocks (
          name text primary key,
          content text,
          updated_at timestamptz default now()
        );
      `
    });

    if (createError) {
      console.error('Erro ao criar tabela:', createError);
      return;
    }

    // Inserir dados iniciais
    const { error: insertError } = await supabase
      .from('ui_blocks')
      .upsert([
        {
          name: 'login_header',
          content: '<div style="padding:12px;text-align:center;">Cabeçalho do Login</div>'
        },
        {
          name: 'login_footer',
          content: '<div style="padding:12px;text-align:center;font-size:12px;color:#666;">© 2025</div>'
        },
        {
          name: 'transmissao_header',
          content: '<div style="padding:12px;text-align:center;">Cabeçalho da Transmissão</div>'
        },
        {
          name: 'transmissao_footer',
          content: '<div style="padding:12px;text-align:center;font-size:12px;color:#666;">Rodapé</div>'
        },
        {
          name: 'transmission_footer',
          content: '<div style="padding:12px;text-align:center;font-size:12px;color:#666;">Footer</div>'
        }
      ]);

    if (insertError) {
      console.error('Erro ao inserir dados:', insertError);
      return;
    }

    console.log('Tabela ui_blocks criada e dados inseridos com sucesso!');
  } catch (error) {
    console.error('Erro:', error);
  }
}

createUIBlocksTable();
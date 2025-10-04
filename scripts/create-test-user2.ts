import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ywcmqgfbxrejuwcbeolu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Y21xZ2ZieHJlanV3Y2Jlb2x1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDk0ODYsImV4cCI6MjA3MzA4NTQ4Nn0.7jRn-l-dwZkbLDKbsUoWg5_HpP58e4GYKoGWH9ienuk'
);

async function createTestUser() {
  try {
    // Primeiro cria o usuário na tabela usuarios
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .insert([
        {
          email: 'teste2@exemplo.com',
          cpf: '98765432100',
          nome: 'Usuário de Teste 2',
          categoria: 'participante'
        }
      ])
      .select()
      .single();

    if (userError) {
      console.error('Erro ao criar usuário:', userError);
      return;
    }

    console.log('Usuário criado:', userData);

    // Agora cria o usuário no auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.cpf,
      options: {
        data: {
          id_usuario: userData.id,
          nome: userData.nome,
          cpf: userData.cpf,
          categoria: userData.categoria
        }
      }
    });

    if (authError) {
      console.error('Erro ao criar auth:', authError);
      return;
    }

    console.log('Auth criado:', authData);
  } catch (err) {
    console.error('Erro:', err);
  }
}

createTestUser();

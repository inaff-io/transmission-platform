import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ywcmqgfbxrejuwcbeolu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Y21xZ2ZieHJlanV3Y2Jlb2x1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDk0ODYsImV4cCI6MjA3MzA4NTQ4Nn0.7jRn-l-dwZkbLDKbsUoWg5_HpP58e4GYKoGWH9ienuk'
);

async function createTestUser() {
  const { data, error } = await supabase
    .from('usuarios')
    .insert([
      {
        email: 'teste@exemplo.com',
        cpf: '12345678901',
        nome: 'Usuário de Teste',
        categoria: 'participante'
      }
    ])
    .select();

  if (error) {
    console.error('Erro:', error);
    return;
  }

  console.log('Usuário criado:', data);
}

createTestUser();

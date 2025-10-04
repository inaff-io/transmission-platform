import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ywcmqgfbxrejuwcbeolu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Y21xZ2ZieHJlanV3Y2Jlb2x1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzUwOTQ4NiwiZXhwIjoyMDczMDg1NDg2fQ.lzbZSx1Qk2oYiXIkF2OGA6qicTXRbF1IQ7UCB3tbNeU';

const main = async () => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Lista todos os usuários
    console.log('Listando todos os usuários...');
    const { data: users, error: listError } = await supabase
      .from('usuarios')
      .select('*');

    if (listError) {
      console.error('Erro ao listar usuários:', listError);
      return;
    }

    console.log('Total de usuários:', users?.length);
    console.log('Usuários:', JSON.stringify(users, null, 2));

    // Tenta buscar o usuário específico
    console.log('\nBuscando usuário pecosta26@gmail.com...');
    const { data: testUser, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', 'pecosta26@gmail.com');

    if (userError) {
      console.error('Erro ao buscar usuário:', userError);
      return;
    }

    console.log('Resultado da busca:', JSON.stringify(testUser, null, 2));

  } catch (error) {
    console.error('Erro:', error);
  }
};

main();

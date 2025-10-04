import { crea    /import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ywcmqgfbxrejuwcbeolu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Y21xZ2ZieHJlanV3Y2Jlb2x1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzUwOTQ4NiwiZXhwIjoyMDczMDg1NDg2fQ.lzbZSx1Qk2oYiXIkF2OGA6qicTXRbF1IQ7UCB3tbNeU';

const main = async () => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);s os usuários
    console.log('Listando todos os usuários...');
    const { data: users, error: listError } = await supabase
      .from('usuarios')
      .select('*');

    if (listError) {
      console.error('Erro ao listar usuários:', listError);
      return;
    }

    console.log('Usuários encontrados:', users);

    // Tenta buscar o usuário específico do teste
    console.log('\nTestando busca de usuário pecosta26@gmail.com...');
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', 'pecosta26@gmail.com');pabase/supabase-js';

const supabaseUrl = 'https://ywcmqgfbxrejuwcbeolu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Y21xZ2ZieHJlanV3Y2Jlb2x1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzUwOTQ4NiwiZXhwIjoyMDczMDg1NDg2fQ.lzbZSx1Qk2oYiXIkF2OGA6qicTXRbF1IQ7UCB3tbNeU';

const main = async () => {
  try {
    if (!supabaseKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY não encontrada');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Testa a conexão
    console.log('Testando conexão...');
    const { count: testData, error: testError } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true });

    if (testError) {
      console.error('Erro ao testar conexão:', testError);
      return;
    }

    console.log('Conexão bem sucedida! Total de usuários:', testData.count);

    // Tenta buscar um usuário específico
    console.log('\nTestando busca de usuário...');
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', 'admin@admin.com')
      .single();

    if (userError) {
      console.error('Erro ao buscar usuário:', userError);
      return;
    }

    console.log('Usuário encontrado:', userData);

  } catch (error) {
    console.error('Erro:', error);
  }
};

main();

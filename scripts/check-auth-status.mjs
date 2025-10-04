import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuthStatus() {
  try {
    console.log('Verificando status de autenticação...');
    
    // Buscar usuários com atividade recente (últimos 5 minutos)
    const now = new Date();
    const limite = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    
    const { data: activeUsers, error: activeError } = await supabase
      .from('usuarios')
      .select('*')
      .gte('last_active', limite);

    if (activeError) {
      console.error('Erro ao buscar usuários ativos:', activeError);
      return;
    }

    console.log('\nUsuários com atividade recente (últimos 5 minutos):');
    console.log('------------------------------------------------');
    
    if (activeUsers && activeUsers.length > 0) {
      activeUsers.forEach(user => {
        console.log(`\nNome: ${user.nome}`);
        console.log(`Email: ${user.email}`);
        console.log(`Categoria: ${user.categoria}`);
        console.log(`Última atividade: ${new Date(user.last_active).toLocaleString()}`);
        console.log('------------------------------------------------');
      });
    } else {
      console.log('Nenhum usuário com atividade recente encontrado');
    }

  } catch (err) {
    console.error('Erro ao verificar status de autenticação:', err);
  }
}

checkAuthStatus();
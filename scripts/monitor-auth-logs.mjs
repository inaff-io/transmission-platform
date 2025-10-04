import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Carrega variáveis de ambiente do .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

if (!process.env.POSTGRES_URL) {
  console.error('Erro: Variável de ambiente POSTGRES_URL não encontrada');
  process.exit(1);
}

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function monitorAuthLogs() {
  const client = await pool.connect();
  
  try {
    // Busca os últimos 10 registros de login
    const loginsQuery = `
      SELECT 
        l.id,
        l.usuario_id,
        l.login_em,
        l.logout_em,
        l.tempo_logado,
        l.ip,
        l.navegador,
        u.nome,
        u.email,
        u.categoria
      FROM logins l
      JOIN usuarios u ON l.usuario_id = u.id
      ORDER BY l.login_em DESC
      LIMIT 10
    `;

    const { rows: logins } = await client.query(loginsQuery);

    if (logins.length === 0) {
      console.log('Nenhum registro de login encontrado.');
      return;
    }

    console.log('\n=== Últimos 10 registros de login/logout ===\n');
    
    logins.forEach(login => {
      const loginTime = new Date(login.login_em).toLocaleString();
      const logoutTime = login.logout_em ? new Date(login.logout_em).toLocaleString() : 'Ainda ativo';
      const duracao = login.tempo_logado 
        ? `${Math.floor(login.tempo_logado / 60)}m ${login.tempo_logado % 60}s`
        : 'Em andamento';

      console.log(`ID: ${login.id}`);
      console.log(`Usuário: ${login.nome} (${login.email})`);
      console.log(`Categoria: ${login.categoria}`);
      console.log(`Login em: ${loginTime}`);
      console.log(`Logout em: ${logoutTime}`);
      console.log(`Duração: ${duracao}`);
      console.log(`IP: ${login.ip}`);
      console.log(`Navegador: ${login.navegador}`);
      console.log('---');
    });

    // Estatísticas
    const statsQuery = `
      SELECT 
        COUNT(*) as total_logins,
        COUNT(CASE WHEN logout_em IS NULL THEN 1 END) as sessoes_ativas
      FROM logins
    `;

    const { rows: [stats] } = await client.query(statsQuery);
    const totalLogins = parseInt(stats.total_logins);
    const sessoesAtivas = parseInt(stats.sessoes_ativas);

    console.log('\n=== Estatísticas ===\n');
    console.log(`Total de logins registrados: ${totalLogins}`);
    console.log(`Sessões ainda ativas: ${sessoesAtivas}`);
    if (totalLogins > 0) {
      console.log(`Taxa de logout: ${((totalLogins - sessoesAtivas) / totalLogins * 100).toFixed(2)}%`);
    }

  } catch (error) {
    console.error('Erro ao monitorar logs:', error);
    if (error.message) {
      console.error('Detalhes do erro:', error.message);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

// Executa o monitoramento
monitorAuthLogs();
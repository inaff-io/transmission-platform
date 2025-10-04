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

let lastCheckTime = new Date();

async function monitorNewLogs() {
  const client = await pool.connect();
  
  try {
    const query = `
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
        u.categoria,
        CASE 
          WHEN l.logout_em IS NOT NULL THEN 'LOGOUT'
          ELSE 'LOGIN'
        END as tipo_evento
      FROM logins l
      JOIN usuarios u ON l.usuario_id = u.id
      WHERE 
        l.login_em > $1 
        OR (l.logout_em IS NOT NULL AND l.logout_em > $1)
      ORDER BY COALESCE(l.logout_em, l.login_em) ASC
    `;

    const { rows: eventos } = await client.query(query, [lastCheckTime]);
    
    eventos.forEach(evento => {
      const time = evento.tipo_evento === 'LOGOUT' 
        ? new Date(evento.logout_em).toLocaleString()
        : new Date(evento.login_em).toLocaleString();

      console.log('\n=== Novo Evento de ' + evento.tipo_evento + ' ===');
      console.log(`Timestamp: ${time}`);
      console.log(`Usuário: ${evento.nome} (${evento.email})`);
      console.log(`Categoria: ${evento.categoria}`);
      console.log(`IP: ${evento.ip}`);
      console.log(`Navegador: ${evento.navegador}`);
      
      if (evento.tipo_evento === 'LOGOUT' && evento.tempo_logado) {
        const minutos = Math.floor(evento.tempo_logado / 60);
        const segundos = evento.tempo_logado % 60;
        console.log(`Duração da sessão: ${minutos}m ${segundos}s`);
      }
      console.log('---');
    });

    if (eventos.length > 0) {
      lastCheckTime = new Date();
    }

  } catch (error) {
    console.error('Erro ao monitorar logs:', error);
    if (error.message) {
      console.error('Detalhes do erro:', error.message);
    }
  } finally {
    client.release();
  }
}

console.log('Iniciando monitoramento de logs em tempo real...');
console.log('Pressione Ctrl+C para encerrar.');
console.log('---');

// Executa imediatamente e depois a cada 5 segundos
monitorNewLogs();
setInterval(monitorNewLogs, 5000);

// Limpa recursos ao encerrar
process.on('SIGINT', async () => {
  console.log('\nEncerrando monitoramento...');
  await pool.end();
  process.exit();
});
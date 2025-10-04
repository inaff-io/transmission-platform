import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = 'https://transmissao.supabase.co';
const supabaseKey = 'Sucesso@1234';

async function executeSQL(filePath: string) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    
    console.log(`✅ Script ${path.basename(filePath)} executado com sucesso!`);
  } catch (error) {
    console.error(`❌ Erro ao executar ${path.basename(filePath)}:`, error);
  }
}

async function main() {
  // Executa os scripts na ordem correta
  await executeSQL(path.join(__dirname, 'reset-and-create.sql'));
  await executeSQL(path.join(__dirname, 'insert-admin.sql'));
}

main();

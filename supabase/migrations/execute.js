const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function executeSQL(filePath) {
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

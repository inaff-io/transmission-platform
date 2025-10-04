const http = require('http');

function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`\n📡 ${description}`);
        console.log(`   Status: ${res.statusCode}`);
        try {
          const parsed = JSON.parse(data);
          console.log(`   Dados:`, JSON.stringify(parsed, null, 2).substring(0, 200));
        } catch (e) {
          console.log(`   Resposta:`, data.substring(0, 100));
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error(`❌ ${description} - Erro:`, error.message);
      resolve();
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testando endpoints do admin...\n');
  
  await testEndpoint('/api/links/active', 'Links Ativos (Frontend)');
  await testEndpoint('/api/admin/links', 'Admin - Lista Links');
  await testEndpoint('/api/admin/logins', 'Admin - Estatísticas de Logins');
  await testEndpoint('/api/admin/online', 'Admin - Usuários Online');
  
  console.log('\n✅ Testes concluídos!');
}

runTests();

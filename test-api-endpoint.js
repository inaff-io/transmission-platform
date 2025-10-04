const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/links/active',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('\n📡 Resposta da API:');
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('\n📄 Resposta (texto):');
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro:', error.message);
});

req.end();

import fetch from 'node-fetch';

const cookie = 'authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyNTMzMTRmOS1iNmE5LTQ3OGQtYjY2Yy0yMTU5MWZkYWJmNWMiLCJlbWFpbCI6InBlY29zdGEyNkBnbWFpbC5jb20iLCJpYXQiOjE3Mjc4NzU1MjksImV4cCI6MTcyODQ4MDMyOX0.a9NsC6QqB0bN6ydYQqsjOXfVkKXxHdXlPY3WfE85zck';

async function testInsert() {
  try {
    console.log('🧪 Testando inserção de link de programação...\n');

    const linkData = {
      tipo: 'programacao',
      url: 'https://inaff.iweventos.com.br/evento/atsmt2025/programacao/lista'
    };

    console.log('📤 Enviando:', linkData);

    const response = await fetch('http://localhost:3002/api/admin/links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie
      },
      body: JSON.stringify(linkData)
    });

    console.log('📥 Status:', response.status);
    
    const data = await response.json();
    console.log('📥 Resposta:', JSON.stringify(data, null, 2));

    // Buscar links
    console.log('\n📊 Buscando links...');
    const getResponse = await fetch('http://localhost:3002/api/admin/links', {
      headers: {
        'Cookie': cookie
      }
    });
    
    const links = await getResponse.json();
    console.log('📊 Links encontrados:', links.length);
    
    if (Array.isArray(links)) {
      links.forEach((link, i) => {
        console.log(`\n🔗 Link ${i + 1}:`);
        console.log('  Tipo:', link.tipo);
        console.log('  URL:', link.url.substring(0, 120) + '...');
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testInsert();

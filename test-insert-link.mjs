import fetch from 'node-fetch';

const cookie = 'authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyNTMzMTRmOS1iNmE5LTQ3OGQtYjY2Yy0yMTU5MWZkYWJmNWMiLCJlbWFpbCI6InBlY29zdGEyNkBnbWFpbC5jb20iLCJpYXQiOjE3Mjc4NzU1MjksImV4cCI6MTcyODQ4MDMyOX0.a9NsC6QqB0bN6ydYQqsjOXfVkKXxHdXlPY3WfE85zck';

async function testInsert() {
  try {
    console.log('🧪 Testando inserção de link de programação...\n');

    const linkData = {
      tipo: 'programacao',
      url: 'https://inaff.iweventos.com.br/evento/atsmt2025/programacao/lista'
    };

    console.log('📤 Enviando dados:', linkData);

    const response = await fetch('http://localhost:3000/api/admin/links', {
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

    if (response.ok) {
      console.log('\n✅ Link inserido com sucesso!');
      console.log('🔗 URL salva:', data.url.substring(0, 100) + '...');
    } else {
      console.log('\n❌ Erro ao inserir link');
    }

    // Verificar se foi salvo no banco
    console.log('\n📊 Verificando links no banco...');
    const linksResponse = await fetch('http://localhost:3000/api/admin/links', {
      headers: {
        'Cookie': cookie
      }
    });
    
    const links = await linksResponse.json();
    console.log('📊 Total de links:', Array.isArray(links) ? links.length : 'N/A');
    
    if (Array.isArray(links)) {
      const programacaoLinks = links.filter(l => l.tipo === 'programacao');
      console.log('📊 Links de programação:', programacaoLinks.length);
      if (programacaoLinks.length > 0) {
        console.log('\n🔍 Último link de programação:');
        console.log(JSON.stringify(programacaoLinks[0], null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testInsert();

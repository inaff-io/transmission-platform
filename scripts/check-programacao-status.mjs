import pg from 'pg';

const client = new pg.Client({
  user: 'postgres.apamlthhsppsjvbxzouv',
  password: 'Sucesso@1234',
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkProgramacaoLink() {
  try {
    await client.connect();
    console.log('✓ Conectado ao PostgreSQL\n');

    const result = await client.query(`
      SELECT id, tipo, url, ativo_em
      FROM links
      WHERE tipo = 'programacao'
      ORDER BY ativo_em DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      console.log('❌ Nenhum link de programação encontrado\n');
      return;
    }

    const link = result.rows[0];
    console.log('📋 Link de Programação Ativo:\n');
    console.log('ID:', link.id);
    console.log('Tipo:', link.tipo);
    console.log('Ativo em:', link.ativo_em);
    console.log('\n📝 URL Completa:');
    console.log(link.url);
    console.log('\n');

    // Análise detalhada
    console.log('🔍 Análise do Iframe:\n');
    
    if (link.url.trim().startsWith('<iframe')) {
      console.log('✓ É um iframe HTML');
      
      // Verifica atributo allow
      const allowMatch = link.url.match(/allow="([^"]*)"/);
      if (allowMatch) {
        console.log('✓ Atributo "allow" encontrado:', allowMatch[1]);
        
        const permissions = allowMatch[1].split(';').map(p => p.trim());
        console.log('\n  Permissões ativas:');
        permissions.forEach(p => console.log(`    - ${p}`));
      } else {
        console.log('❌ Atributo "allow" NÃO encontrado');
      }
      
      // Verifica atributo sandbox
      const sandboxMatch = link.url.match(/sandbox="([^"]*)"/);
      if (sandboxMatch) {
        console.log('⚠️  Atributo "sandbox" encontrado:', sandboxMatch[1]);
        console.log('   (Sandbox pode bloquear o conteúdo!)');
      } else {
        console.log('✓ Sem atributo "sandbox"');
      }
      
      // Verifica src
      const srcMatch = link.url.match(/src="([^"]*)"/);
      if (srcMatch) {
        console.log('✓ URL src:', srcMatch[1]);
      }
      
      // Verifica allowfullscreen
      if (link.url.includes('allowfullscreen')) {
        console.log('✓ Atributo "allowfullscreen" presente');
      } else {
        console.log('❌ Atributo "allowfullscreen" ausente');
      }
      
    } else if (link.url.trim().startsWith('<div')) {
      console.log('✓ É um wrapper HTML (div)');
    } else {
      console.log('⚠️  É uma URL simples (não é HTML)');
      console.log('   URL:', link.url);
    }

    console.log('\n');
    console.log('=' .repeat(80));
    console.log('📊 RESUMO DO STATUS');
    console.log('=' .repeat(80));
    
    const isHtml = link.url.trim().startsWith('<');
    const hasAllow = link.url.includes('allow=');
    const hasSandbox = link.url.includes('sandbox=');
    const hasAllowFullscreen = link.url.includes('allowfullscreen');
    
    console.log('\n✓ Formato HTML:', isHtml ? 'SIM' : 'NÃO');
    console.log('✓ Tem permissões (allow):', hasAllow ? 'SIM' : 'NÃO');
    console.log('✓ Tem fullscreen:', hasAllowFullscreen ? 'SIM' : 'NÃO');
    console.log('⚠️  Tem sandbox (ruim):', hasSandbox ? 'SIM' : 'NÃO');
    
    if (isHtml && hasAllow && hasAllowFullscreen && !hasSandbox) {
      console.log('\n✅ STATUS: CONFIGURAÇÃO CORRETA! O iframe deve funcionar.');
    } else {
      console.log('\n❌ STATUS: CONFIGURAÇÃO INCORRETA. Precisa ajustar:');
      if (!isHtml) console.log('   - Converter para iframe HTML');
      if (!hasAllow) console.log('   - Adicionar atributo "allow"');
      if (!hasAllowFullscreen) console.log('   - Adicionar "allowfullscreen"');
      if (hasSandbox) console.log('   - Remover atributo "sandbox"');
    }
    
    console.log('\n');

  } catch (error) {
    console.error('✗ Erro:', error);
  } finally {
    await client.end();
  }
}

checkProgramacaoLink();

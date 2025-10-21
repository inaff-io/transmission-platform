#!/usr/bin/env node

/**
 * Analisa uso do Supabase no projeto
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

console.log('╔════════════════════════════════════════════════╗');
console.log('║   ANÁLISE: USO DO SUPABASE NO PROJETO          ║');
console.log('╚════════════════════════════════════════════════╝\n');

const projectRoot = process.cwd();

// Padrões para procurar
const patterns = {
  supabaseImport: /@supabase\/supabase-js|@supabase\/auth-helpers/g,
  supabaseClient: /supabase\./g,
  createClient: /createClient\(/g,
  supabaseAuth: /supabase\.auth\./g,
  supabaseFrom: /supabase\.from\(/g,
};

const results = {
  files: [],
  totalOccurrences: 0,
  byType: {
    imports: 0,
    auth: 0,
    queries: 0,
    other: 0
  }
};

function scanDirectory(dir, baseDir = '') {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = join(dir, file);
    const relativePath = join(baseDir, file);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Ignorar node_modules, .next, etc
      if (!file.startsWith('.') && file !== 'node_modules' && file !== '.next') {
        scanDirectory(fullPath, relativePath);
      }
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      scanFile(fullPath, relativePath);
    }
  });
}

function scanFile(filePath, relativePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const fileResults = {
      path: relativePath,
      occurrences: [],
      lines: []
    };
    
    let hasSupabase = false;
    
    // Procurar por cada padrão
    Object.entries(patterns).forEach(([type, pattern]) => {
      const matches = content.match(pattern);
      if (matches) {
        hasSupabase = true;
        fileResults.occurrences.push({
          type,
          count: matches.length
        });
        
        // Categorizar
        if (type === 'supabaseImport') results.byType.imports += matches.length;
        else if (type === 'supabaseAuth') results.byType.auth += matches.length;
        else if (type === 'supabaseFrom') results.byType.queries += matches.length;
        else results.byType.other += matches.length;
        
        results.totalOccurrences += matches.length;
      }
    });
    
    if (hasSupabase) {
      // Encontrar linhas específicas
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('supabase') || line.includes('@supabase')) {
          fileResults.lines.push({
            number: index + 1,
            content: line.trim().substring(0, 80)
          });
        }
      });
      
      results.files.push(fileResults);
    }
  } catch (error) {
    // Ignorar erros de leitura
  }
}

// Escanear diretórios principais
console.log('🔍 Escaneando projeto...\n');

scanDirectory(join(projectRoot, 'src'), 'src');
scanDirectory(join(projectRoot, 'scripts'), 'scripts');

console.log('═══════════════════════════════════════════════\n');
console.log(`📊 ESTATÍSTICAS:\n`);
console.log(`Arquivos que usam Supabase: ${results.files.length}`);
console.log(`Total de ocorrências: ${results.totalOccurrences}\n`);

console.log('Por tipo:');
console.log(`  • Imports (@supabase/*): ${results.byType.imports}`);
console.log(`  • Auth (supabase.auth.*): ${results.byType.auth}`);
console.log(`  • Queries (supabase.from): ${results.byType.queries}`);
console.log(`  • Outros: ${results.byType.other}\n`);

console.log('═══════════════════════════════════════════════\n');
console.log('📁 ARQUIVOS ENCONTRADOS:\n');

if (results.files.length === 0) {
  console.log('✅ Nenhum arquivo usando Supabase encontrado!\n');
  console.log('🎉 Seu projeto JÁ ESTÁ 100% usando PostgreSQL direto!\n');
} else {
  results.files.forEach((file, index) => {
    console.log(`${index + 1}. ${file.path}`);
    
    file.occurrences.forEach(occ => {
      console.log(`   • ${occ.type}: ${occ.count} vez(es)`);
    });
    
    console.log(`   Linhas com Supabase:`);
    file.lines.slice(0, 3).forEach(line => {
      console.log(`   L${line.number}: ${line.content}`);
    });
    
    if (file.lines.length > 3) {
      console.log(`   ... +${file.lines.length - 3} linhas\n`);
    } else {
      console.log('');
    }
  });
  
  console.log('═══════════════════════════════════════════════\n');
  console.log('🎯 RECOMENDAÇÕES:\n');
  
  const highPriority = results.files.filter(f => 
    f.occurrences.some(o => o.type === 'supabaseAuth' || o.type === 'supabaseFrom')
  );
  
  const lowPriority = results.files.filter(f => 
    !f.occurrences.some(o => o.type === 'supabaseAuth' || o.type === 'supabaseFrom')
  );
  
  if (highPriority.length > 0) {
    console.log('📌 ALTA PRIORIDADE (Usa funcionalidades Supabase):');
    highPriority.forEach(f => {
      console.log(`   • ${f.path}`);
      const authCount = f.occurrences.find(o => o.type === 'supabaseAuth')?.count || 0;
      const queryCount = f.occurrences.find(o => o.type === 'supabaseFrom')?.count || 0;
      
      if (authCount > 0) console.log(`     - Auth: ${authCount} uso(s) - Migrar para JWT`);
      if (queryCount > 0) console.log(`     - Queries: ${queryCount} uso(s) - Migrar para pg`);
    });
    console.log('');
  }
  
  if (lowPriority.length > 0) {
    console.log('📎 BAIXA PRIORIDADE (Apenas imports):');
    lowPriority.forEach(f => {
      console.log(`   • ${f.path} - Deletar arquivo ou remover import`);
    });
    console.log('');
  }
}

console.log('═══════════════════════════════════════════════\n');
console.log('📋 PRÓXIMOS PASSOS:\n');

if (results.files.length === 0) {
  console.log('1. ✅ Código já está migrado!');
  console.log('2. Remover dependências:');
  console.log('   npm uninstall @supabase/supabase-js @supabase/auth-helpers-nextjs');
  console.log('3. Remover variáveis de ambiente do Supabase');
  console.log('4. Limpar arquivos não usados\n');
} else {
  console.log('1. Migrar arquivos de alta prioridade (ver lista acima)');
  console.log('2. Testar cada migração individualmente');
  console.log('3. Remover arquivos de baixa prioridade');
  console.log('4. Remover dependências do package.json');
  console.log('5. Fazer deploy e validar\n');
  
  console.log('💡 Comandos úteis:\n');
  console.log('# Ver dependências Supabase no package.json:');
  console.log('cat package.json | grep supabase\n');
  
  console.log('# Procurar usos específicos:');
  console.log('grep -r "supabase\\." src/ --include="*.ts"\n');
  
  console.log('# Remover dependências:');
  console.log('npm uninstall @supabase/supabase-js @supabase/auth-helpers-nextjs\n');
}

console.log('╔════════════════════════════════════════════════╗');
console.log('║         FIM DA ANÁLISE                         ║');
console.log('╚════════════════════════════════════════════════╝\n');

console.log('📚 Documentação: REMOVER-SUPABASE-GUIA.md\n');

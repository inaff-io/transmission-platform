import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

/**
 * Script para adicionar o logo do evento
 * 
 * USO:
 * 1. Coloque seu arquivo de logo em: public/upload/evento/logo/logo.png
 * 2. Execute: node scripts/add-event-logo.mjs
 */

async function checkLogo() {
  const logoPath = path.join(projectRoot, 'public', 'upload', 'evento', 'logo', 'doHKepqoQ8RtQMW5qzQ1IF28zag8.png');
  
  try {
    await fs.access(logoPath);
    console.log('✅ Logo encontrado:', logoPath);
    const stats = await fs.stat(logoPath);
    console.log('📊 Tamanho:', (stats.size / 1024).toFixed(2), 'KB');
    console.log('📅 Última modificação:', stats.mtime.toLocaleString());
    return true;
  } catch (error) {
    console.log('❌ Logo não encontrado:', logoPath);
    console.log('\n📝 Para adicionar o logo:');
    console.log('   1. Copie seu arquivo de imagem');
    console.log('   2. Cole em:', logoPath);
    console.log('   3. Execute este script novamente\n');
    return false;
  }
}

console.log('🔍 Verificando logo do evento...\n');
await checkLogo();

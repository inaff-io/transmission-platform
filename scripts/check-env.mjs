import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Lista todos os arquivos .env possíveis
const envFiles = [
  '.env',
  '.env.local',
  '.env.development',
  '.env.development.local',
  '.env.production',
  '.env.production.local'
];

console.log('Procurando arquivos .env...\n');

envFiles.forEach(file => {
  const filePath = join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`Arquivo ${file} encontrado`);
    const envConfig = dotenv.parse(fs.readFileSync(filePath));
    console.log('Variáveis encontradas:');
    Object.keys(envConfig).forEach(key => {
      // Oculta valores sensíveis
      const value = key.toLowerCase().includes('key') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('password')
        ? '[VALOR SENSÍVEL]'
        : envConfig[key];
      console.log(`- ${key}: ${value}`);
    });
    console.log('\n-------------------\n');
  } else {
    console.log(`Arquivo ${file} não encontrado`);
  }
});

// Verifica variáveis de ambiente carregadas
console.log('\nVariáveis de ambiente atualmente carregadas:');
const envVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'POSTGRES_URL',
  'JWT_SECRET',
  'JWT_EXPIRATION'
];

envVars.forEach(key => {
  const value = process.env[key];
  if (value) {
    // Oculta valores sensíveis
    const displayValue = key.toLowerCase().includes('key') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('password')
      ? '[VALOR SENSÍVEL]'
      : value;
    console.log(`- ${key}: ${displayValue}`);
  } else {
    console.log(`- ${key}: não definido`);
  }
});
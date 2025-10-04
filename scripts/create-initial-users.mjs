import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function createUsers() {
  try {
    // Criar usuário admin
    const admin = await prisma.usuario.create({
      data: {
        categoria: 'admin',
        nome: 'Pedro Costa',
        email: 'pecosta26@gmail.com',
        cpf: '12345678901',
        status: true
      }
    });
    console.log('✅ Usuário admin criado:', admin);

    // Criar usuário regular
    const user = await prisma.usuario.create({
      data: {
        categoria: 'user',
        nome: 'João Silva',
        email: 'joao.silva@example.com',
        cpf: '98765432101',
        status: true
      }
    });
    console.log('✅ Usuário regular criado:', user);

  } catch (error) {
    console.error('❌ Erro ao criar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUsers();
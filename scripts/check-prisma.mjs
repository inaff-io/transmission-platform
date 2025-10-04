import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Configuração do dotenv
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

const prisma = new PrismaClient()

async function checkConnection() {
  try {
    console.log('Verificando conexão com o banco de dados...')

    // Tenta buscar todos os usuários
    const users = await prisma.usuario.findMany()
    console.log('Usuários encontrados:', users.length)
    users.forEach(user => {
      console.log('- Nome:', user.nome)
      console.log('  Email:', user.email)
      console.log('  CPF:', user.cpf)
      console.log('  Categoria:', user.categoria)
      console.log('---')
    })

    console.log('Conexão com o banco de dados está funcionando corretamente!')
  } catch (error) {
    console.error('Erro ao verificar conexão:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkConnection()
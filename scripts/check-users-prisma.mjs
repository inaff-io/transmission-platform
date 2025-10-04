import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  console.log('\n=== Verificando usuários no banco de dados ===\n');

  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✓ Total de usuários encontrados: ${usuarios.length}\n`);

    if (usuarios.length > 0) {
      console.log('Lista de usuários:');
      console.log('==================\n');

      usuarios.forEach((user, index) => {
        console.log(`${index + 1}. ${user.nome}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   CPF: ${user.cpf}`);
        console.log(`   Categoria: ${user.categoria}`);
        console.log(`   Status: ${user.status ? 'Ativo ✓' : 'Inativo ✗'}`);
        console.log(`   Criado em: ${user.createdAt}`);
        console.log(`   Último acesso: ${user.lastActive || 'Nunca'}`);
        console.log(`   ID: ${user.id}`);
        console.log('');
      });

      // Estatísticas
      const admins = usuarios.filter(u => u.categoria === 'admin').length;
      const users = usuarios.filter(u => u.categoria === 'user').length;
      const ativos = usuarios.filter(u => u.status).length;

      console.log('Estatísticas:');
      console.log('=============');
      console.log(`Administradores: ${admins}`);
      console.log(`Usuários: ${users}`);
      console.log(`Ativos: ${ativos}`);
      console.log(`Inativos: ${usuarios.length - ativos}`);
    } else {
      console.log('⚠ Nenhum usuário encontrado no banco de dados.');
      console.log('\nPara criar um usuário, use o Prisma Studio:');
      console.log('  npx prisma studio');
    }
  } catch (err) {
    console.error('❌ Erro ao verificar usuários:', err.message);
    
    if (err.code === 'P2021') {
      console.log('\n⚠ A tabela "Usuario" não existe no banco de dados.');
      console.log('Execute as migrações primeiro:');
      console.log('  npx prisma migrate dev');
    }
  } finally {
    await prisma.$disconnect();
  }
}

console.log('Iniciando verificação com Prisma...');
await checkUsers();
console.log('\n✓ Verificação concluída!');

import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt-server';
import pg from 'pg';

const { Pool } = pg;

// Pool compartilhado para reutilizar conexões
const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
  max: 20,
});

interface UserData {
  nome: string;
  email: string;
  cpf: string;
  categoria?: string;
}

const COLUMN_MAP: Record<string, keyof UserData> = {
  nome: 'nome',
  nomecompleto: 'nome',
  nomeusuario: 'nome',
  usuario: 'nome',
  email: 'email',
  e_mail: 'email',
  emailaddress: 'email',
  correioeletronico: 'email',
  cpf: 'cpf',
  documento: 'cpf',
  documentooficial: 'cpf',
  cpfcnpj: 'cpf',
  categoria: 'categoria',
  perfil: 'categoria',
  tipo: 'categoria',
  papel: 'categoria',
};

const normalizeKey = (key: string) =>
  key
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();

const normalizeRow = (row: Record<string, unknown>) => {
  const normalized: Partial<UserData> = {};

  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = normalizeKey(key);
    const mappedKey = COLUMN_MAP[normalizedKey];

    if (mappedKey) {
      normalized[mappedKey] = value as string;
      continue;
    }

    if (!normalized.nome && normalizedKey.includes('nome')) {
      normalized.nome = value as string;
      continue;
    }

    if (!normalized.email && normalizedKey.includes('email')) {
      normalized.email = value as string;
      continue;
    }

    if (!normalized.cpf && normalizedKey.includes('cpf')) {
      normalized.cpf = value as string;
      continue;
    }

    if (!normalized.categoria && (normalizedKey.includes('categoria') || normalizedKey.includes('perfil'))) {
      normalized.categoria = value as string;
    }
  }

  return normalized;
};

const toStringValue = (value: unknown) =>
  typeof value === 'string'
    ? value.trim()
    : value !== undefined && value !== null
    ? String(value).trim()
    : '';

export async function POST(request: Request) {
  const client = await pool.connect();
  
  try {
    // Verifica autenticação de admin
    const token = request.headers.get('cookie')?.match(/authToken=([^;]+)/)?.[1];
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.categoria !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { data } = await request.json();
    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Formato inválido: dados devem ser um array' },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      errors: [] as string[],
    };

    // Processa cada linha do Excel
    for (const row of data) {
      try {
        if (!row || typeof row !== 'object') {
          results.errors.push(`Linha inválida: formato inesperado (${JSON.stringify(row)})`);
          continue;
        }

        const originalRow = row as Record<string, unknown>;
        const normalizedRow = normalizeRow(originalRow);

        const nomeValue = toStringValue(normalizedRow.nome ?? originalRow['nome']);
        const emailValue = toStringValue(normalizedRow.email ?? originalRow['email']);
        const cpfValue = toStringValue(normalizedRow.cpf ?? originalRow['cpf']);
        const categoriaValue = toStringValue(normalizedRow.categoria ?? originalRow['categoria']);

        // Valida dados obrigatórios
        if (!nomeValue || !emailValue || !cpfValue) {
          results.errors.push(
            `Linha inválida: nome, email e cpf são obrigatórios - ${JSON.stringify(row)}`
          );
          continue;
        }

        // Limpa e valida CPF
        const cpf = cpfValue.replaceAll(/\D/g, '');
        if (cpf.length !== 11) {
          results.errors.push(`CPF inválido para ${nomeValue}: ${cpfValue}`);
          continue;
        }

        // Valida email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
          results.errors.push(`Email inválido para ${nomeValue}: ${emailValue}`);
          continue;
        }

        // Prepara dados para inserção
        const userData: UserData = {
          nome: nomeValue,
          email: emailValue.toLowerCase(),
          cpf,
          categoria:
            categoriaValue.toLowerCase() === 'admin' || categoriaValue.toLowerCase() === 'administrador'
              ? 'admin'
              : 'user',
        };

        // Verifica se usuário já existe (por email ou CPF)
        const { rows: existingUsers } = await client.query(
          `SELECT id, email, cpf FROM usuarios WHERE email = $1 OR cpf = $2`,
          [userData.email, cpf]
        );

        if (existingUsers.length > 0) {
          // Atualiza usuário existente
          const existingUser = existingUsers[0];
          await client.query(
            `UPDATE usuarios 
             SET nome = $1, email = $2, cpf = $3, categoria = $4, updated_at = NOW()
             WHERE id = $5`,
            [userData.nome, userData.email, userData.cpf, userData.categoria, existingUser.id]
          );
        } else {
          // PostgreSQL gera UUID automaticamente via gen_random_uuid()
          await client.query(
            `INSERT INTO usuarios (nome, email, cpf, categoria, status, ativo, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
            [userData.nome, userData.email, userData.cpf, userData.categoria, true, true]
          );
        }

        results.success++;
      } catch (error: any) {
        if (error.code === '23505') {
          results.errors.push(`Usuário já existe: ${(row as any).email} ou CPF ${(row as any).cpf}`);
        } else {
          results.errors.push(`Erro ao processar linha: ${error.message}`);
        }
      }
    }

    return NextResponse.json({
      message: `Importação concluída: ${results.success} usuários importados com sucesso`,
      results,
    });
  } catch (error) {
    console.error('Erro na importação:', error);
    return NextResponse.json(
      {
        error: 'Erro ao processar importação',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
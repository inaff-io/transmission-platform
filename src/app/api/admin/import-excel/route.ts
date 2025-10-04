import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyToken } from '@/lib/jwt-server';

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

    const supabase = createAdminClient();
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
        const cpf = cpfValue.replace(/\D/g, '');
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

        // Insere no banco
        const { error } = await supabase
          .from('usuarios')
          .upsert(
            {
              ...userData,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'email,cpf',
            }
          );

        if (error) {
          if (error.code === '23505') { // Unique violation
            results.errors.push(`Usuário já existe: ${userData.email} ou ${userData.cpf}`);
          } else {
            results.errors.push(`Erro ao inserir ${userData.nome}: ${error.message}`);
          }
          continue;
        }

        results.success++;
      } catch (error) {
        results.errors.push(`Erro ao processar linha: ${error instanceof Error ? error.message : String(error)}`);
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
  }
}
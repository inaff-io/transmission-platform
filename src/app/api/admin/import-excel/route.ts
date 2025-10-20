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

/**
 * Gera um ID único baseado no email do usuário
 * Adiciona sufixo numérico se ID já existir
 */
async function generateUniqueUserId(
  supabase: ReturnType<typeof createAdminClient>,
  email: string,
  nome: string
): Promise<string | null> {
  // Tenta usar parte do email como ID base
  let baseId = email.split('@')[0].toLowerCase().replaceAll(/[^a-z0-9]/g, '_');
  
  // Se o ID base estiver vazio, usa parte do nome
  if (!baseId || baseId.length < 3) {
    baseId = nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replaceAll(/[^a-z0-9]/g, '_')
      .slice(0, 20);
  }
  
  const maxAttempts = 20;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidateId = attempt === 0 ? baseId : `${baseId}_${attempt}`;
    
    // Verifica se ID já existe
    const { data: existing } = await supabase
      .from('usuarios')
      .select('id')
      .eq('id', candidateId)
      .single();
    
    if (!existing) {
      return candidateId;
    }
  }
  
  // Se não conseguiu gerar ID único, usa timestamp
  return `${baseId}_${Date.now()}`;
}

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

        // Verifica se usuário já existe (por email ou CPF)
        const { data: existingUser } = await supabase
          .from('usuarios')
          .select('id, email, cpf')
          .or(`email.eq.${userData.email},cpf.eq.${cpf}`)
          .single();

        if (existingUser) {
          // Atualiza usuário existente
          const { error } = await supabase
            .from('usuarios')
            .update({
              nome: userData.nome,
              email: userData.email,
              cpf: userData.cpf,
              categoria: userData.categoria,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingUser.id);

          if (error) {
            results.errors.push(`Erro ao atualizar ${userData.nome}: ${error.message}`);
            continue;
          }
        } else {
          // Gera ID único automaticamente
          const userId = await generateUniqueUserId(supabase, userData.email, userData.nome);
          
          if (!userId) {
            results.errors.push(`Erro ao gerar ID único para ${userData.nome}`);
            continue;
          }
          
          const { error } = await supabase
            .from('usuarios')
            .insert({
              id: userId,
              nome: userData.nome,
              email: userData.email,
              cpf: userData.cpf,
              categoria: userData.categoria,
              status: true,
              ativo: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (error) {
            if (error.code === '23505') {
              results.errors.push(`Usuário já existe: ${userData.email} ou CPF ${userData.cpf}`);
            } else {
              results.errors.push(`Erro ao inserir ${userData.nome}: ${error.message}`);
            }
            continue;
          }
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
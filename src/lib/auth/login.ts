import { findUserByEmail, findUserByCpf, createLoginRecord, updateUserLastActive } from '@/lib/db/pg-client';
import { createToken } from '@/lib/jwt-server';

export type LoginMode = 'any' | 'admin' | 'user';

interface LoginInput {
  email?: string;
  cpf?: string;
  mode: LoginMode;
}

export interface LoginResult {
  success: boolean;
  redirectUrl?: string;
  token?: string;
  user?: {
    id: string;
    nome: string;
    categoria: string;
  };
  error?: string;
  status?: number;
  message?: string;
}

export async function performLogin({ email, cpf, mode }: LoginInput): Promise<LoginResult> {
  if (!email && !cpf) {
    return { success: false, error: 'Digite seu e-mail ou CPF', status: 400 };
  }

  // Limpa o CPF de caracteres não numéricos
  const cleanedCpf = cpf ? cpf.replace(/\D/g, '') : undefined;

  console.log('[DEBUG] Tentando login com PostgreSQL direto:', {
    email: email ? email.toLowerCase().trim() : undefined,
    cpf: cleanedCpf,
    mode
  });

  let user = null;
  let error = null;

  try {
    // Busca o usuário por email ou CPF usando PostgreSQL direto
    if (email) {
      user = await findUserByEmail(email.toLowerCase().trim());
    } else if (cleanedCpf) {
      user = await findUserByCpf(cleanedCpf);
    }
  } catch (err: any) {
    console.error('[DEBUG] Erro na consulta:', err);
    error = {
      message: err.message || 'Erro ao buscar usuário',
      details: err.toString()
    };
  }

  console.log('[DEBUG] Resultado da consulta:', {
    user: user ? { id: user.id, email: user.email, categoria: user.categoria } : null,
    error
  });

  if (error || !user) {
    return {
      success: false,
      error: 'Usuário não encontrado',
      message: 'Verifique se você digitou o e-mail ou CPF corretamente',
      status: 404
    };
  }

  // Verifica se o usuário está ativo
  if (!user.status) {
    return {
      success: false,
      error: 'Usuário inativo',
      message: 'Entre em contato com o administrador',
      status: 403
    };
  }

  // Lista de e-mails que devem ser administradores
  const ADMIN_EMAILS = new Set<string>(['pecosta26@gmail.com', 'admin.test@example.com']);

  let categoria = (user.categoria || '').toLowerCase();
  
  // Se categoria não estiver definida, usa a lista de admins
  if (!categoria) {
    categoria = ADMIN_EMAILS.has(user.email.toLowerCase()) ? 'admin' : 'user';
    console.warn('[login] Campo categoria ausente. Atribuindo calculada:', categoria, {
      id: user.id,
      email: user.email
    });
  }

  // Verifica permissões baseadas no modo de login
  if (mode === 'admin' && categoria !== 'admin') {
    return { 
      success: false, 
      error: 'Acesso restrito a administradores', 
      message: 'Você não tem permissão para acessar o painel administrativo',
      status: 403 
    };
  }
  
  if (mode === 'user' && categoria === 'admin') {
    return { 
      success: false, 
      error: 'Use a rota de login de administrador', 
      message: 'Administradores devem usar a página de login admin',
      status: 403 
    };
  }

  // Cria registro de login
  try {
    await createLoginRecord(user.id);
    await updateUserLastActive(user.id);
    console.log('[DEBUG] Registro de login criado com sucesso');
  } catch (err) {
    console.warn('[DEBUG] Erro ao criar registro de login:', err);
    // Não falha o login por causa disso
  }

  // Cria o token JWT
  const token = await createToken({ ...user, categoria });
  // Redireciona admin para /admin e usuários normais para /transmission
  const redirectUrl = categoria === 'admin' ? '/admin' : '/transmission';

  console.log('[DEBUG] Login bem-sucedido!', {
    userId: user.id,
    categoria,
    redirectUrl
  });

  return {
    success: true,
    token,
    redirectUrl,
    user: {
      id: user.id,
      nome: user.nome,
      categoria
    }
  };
}

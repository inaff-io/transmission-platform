import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '';

interface AuthResult {
  ok: boolean;
  error?: string;
  status: number;
  user?: any;
}

import type { Role } from '@/types/auth';

export async function checkAuth(
  requiredRoles: Role[] = [],
  options: { strict?: boolean } = { strict: true },
): Promise<AuthResult> {
  try {
    // Verifica se as variáveis de ambiente estão configuradas
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Variáveis de ambiente do Supabase não configuradas');
      return {
        ok: false,
        error: 'Configuração do servidor incompleta. Verifique as variáveis de ambiente.',
        status: 500,
      };
    }

    const cookieStore = cookies();
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'supabase-auth',
        storage: {
          getItem: (key: string) => {
            const cookie = cookieStore.get(key);
            return cookie?.value ?? null;
          },
          setItem: () => {},
          removeItem: () => {}
        }
      }
    });

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.error('Erro de autenticação:', error);
      return {
        ok: false,
        error: 'Não autenticado',
        status: 401,
      };
    }

    if (requiredRoles.length === 0) {
      return { ok: true, status: 200, user };
    }

    // Verifica roles do usuário
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('Erro ao buscar roles:', rolesError);
      return {
        ok: false,
        error: 'Erro ao verificar permissões',
        status: 500,
      };
    }

    const roles = userRoles?.map((r) => r.role as Role) || [];

    if (options.strict) {
      // No modo strict, o usuário precisa ter TODAS as roles requeridas
      const hasAllRoles = requiredRoles.every((role) => roles.includes(role));
      if (!hasAllRoles) {
        return {
          ok: false,
          error: 'Sem permissão',
          status: 403,
        };
      }
    } else {
      // No modo não-strict, o usuário precisa ter PELO MENOS UMA das roles requeridas
      const hasAnyRole = requiredRoles.some((role) => roles.includes(role));
      if (!hasAnyRole) {
        return {
          ok: false,
          error: 'Sem permissão',
          status: 403,
        };
      }
    }

    return { ok: true, status: 200, user };
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    return {
      ok: false,
      error: 'Erro ao verificar autenticação',
      status: 500,
    };
  }
}
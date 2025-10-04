import { createAdminClient } from '@/lib/supabase/admin';
import { validateLoginData } from './validation';
import { withRetry } from '@/lib/utils/retry';
import { logger } from '@/lib/utils/logger';

interface LoginError {
  code: string;
  message: string;
  details?: unknown;
}

export async function registerLogin(userId: string, ip: string, userAgent: string) {
  try {
    logger.info({
      message: 'Iniciando registro de login',
      userId,
      ip,
      userAgent,
      context: { operation: 'registerLogin' }
    });

    const loginData = {
      usuario_id: userId,
      ip: ip || 'unknown',
      navegador: userAgent || 'unknown'
    };

    const validationResult = validateLoginData(loginData);
    if (!validationResult.success) {
      const error = {
        code: 'VALIDATION_ERROR',
        message: validationResult.error?.message || 'Erro de validação',
        details: validationResult.error?.details
      } as LoginError;

      logger.error({
        message: 'Falha na validação dos dados de login',
        error,
        userId,
        context: {
          operation: 'registerLogin',
          validationErrors: validationResult.error?.details
        }
      });

      throw error;
    }

    const supabase = createAdminClient();
    
    await withRetry(async () => {
      logger.debug({
        message: 'Tentando inserir registro de login',
        userId,
        context: { operation: 'registerLogin', data: loginData }
      });

      const { error } = await supabase.from('logins').insert(loginData);
      if (error) {
        const loginError = {
          code: error.code,
          message: 'Erro ao registrar login no banco de dados',
          details: error
        } as LoginError;

        logger.error({
          message: 'Falha ao inserir registro de login',
          error: loginError,
          userId,
          context: { operation: 'registerLogin', attempt: 'insert' }
        });

        throw loginError;
      }
    }, {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 5000,
      retryableErrors: ['PGRST116', '23505', '40001', '40P01', 'PGRST301']
    });

    logger.info({
      message: 'Login registrado com sucesso',
      userId,
      context: { operation: 'registerLogin', status: 'success' }
    });

    return { success: true };
  } catch (error) {
    logger.error({
      message: 'Erro ao registrar login',
      error,
      userId,
      context: { operation: 'registerLogin', status: 'error' }
    });

    if ((error as LoginError).code) {
      throw error;
    }

    throw {
      code: 'UNKNOWN_ERROR',
      message: 'Erro desconhecido ao registrar login',
      details: error
    } as LoginError;
  }
}

export async function registerLogout(userId: string) {
  try {
    logger.info({
      message: 'Iniciando registro de logout',
      userId,
      context: { operation: 'registerLogout' }
    });

    if (!userId) {
      const error = {
        code: 'VALIDATION_ERROR',
        message: 'ID do usuário é obrigatório para registrar logout'
      } as LoginError;

      logger.error({
        message: 'ID do usuário não fornecido para logout',
        error,
        context: { operation: 'registerLogout' }
      });

      throw error;
    }

    const supabase = createAdminClient();
    
    return await withRetry(async () => {
      logger.debug({
        message: 'Buscando último login ativo do usuário',
        userId,
        context: { operation: 'registerLogout', step: 'findLastLogin' }
      });

      // Busca o último login do usuário que ainda não tem logout registrado
      const { data: lastLogin, error: queryError } = await supabase
        .from('logins')
        .select('*')
        .eq('usuario_id', userId)
        .is('logout_em', null)
        .order('login_em', { ascending: false })
        .limit(1)
        .single();

      if (queryError) {
        const error = {
          code: queryError.code || 'DB_ERROR',
          message: 'Erro ao buscar último login do usuário',
          details: queryError
        } as LoginError;

        logger.error({
          message: 'Falha ao buscar último login',
          error,
          userId,
          context: { operation: 'registerLogout', step: 'findLastLogin' }
        });

        throw error;
      }

      if (!lastLogin) {
        const error = {
          code: 'NOT_FOUND',
          message: 'Nenhum login ativo encontrado para este usuário'
        } as LoginError;

        logger.warn({
          message: 'Nenhum login ativo encontrado',
          userId,
          context: { operation: 'registerLogout', step: 'findLastLogin' }
        });

        throw error;
      }

      const logoutTime = new Date();
      const loginTime = new Date(lastLogin.login_em);
      const tempoLogado = Math.floor((logoutTime.getTime() - loginTime.getTime()) / 1000);

      logger.debug({
        message: 'Atualizando registro de login com informações de logout',
        userId,
        context: {
          operation: 'registerLogout',
          step: 'updateLogin',
          loginId: lastLogin.id,
          tempoLogado
        }
      });

      const { error: updateError } = await supabase
        .from('logins')
        .update({
          logout_em: logoutTime.toISOString(),
          tempo_logado: tempoLogado
        })
        .eq('id', lastLogin.id);

      if (updateError) {
        const error = {
          code: updateError.code || 'DB_ERROR',
          message: 'Erro ao registrar logout no banco de dados',
          details: updateError
        } as LoginError;

        logger.error({
          message: 'Falha ao atualizar registro com logout',
          error,
          userId,
          context: {
            operation: 'registerLogout',
            step: 'updateLogin',
            loginId: lastLogin.id
          }
        });

        throw error;
      }

      logger.info({
        message: 'Logout registrado com sucesso',
        userId,
        context: {
          operation: 'registerLogout',
          status: 'success',
          loginId: lastLogin.id,
          tempoLogado
        }
      });

      return { success: true };
    }, {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 5000,
      retryableErrors: ['PGRST116', '23505', '40001', '40P01', 'PGRST301']
    });
  } catch (error) {
    logger.error({
      message: 'Erro ao registrar logout',
      error,
      userId,
      context: { operation: 'registerLogout', status: 'error' }
    });

    if ((error as LoginError).code) {
      throw error;
    }

    throw {
      code: 'UNKNOWN_ERROR',
      message: 'Erro desconhecido ao registrar logout',
      details: error
    } as LoginError;
  }
}

interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryableErrors?: string[];
}

const defaultOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 5000,
  backoffFactor: 2,
  retryableErrors: [
    'PGRST116', // PostgreSQL connection error
    '23505',    // Unique violation
    '40001',    // Serialization failure
    '40P01',    // Deadlock detected
    'PGRST301'  // Database connection error
  ]
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const finalOptions = { ...defaultOptions, ...options };
  let lastError: Error | null = null;
  let delay = finalOptions.initialDelay;

  for (let attempt = 1; attempt <= finalOptions.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      const errorCode = (error as any).code;

      // Se não é um erro retryable ou é a última tentativa, lança o erro
      if (
        !finalOptions.retryableErrors.includes(errorCode) ||
        attempt === finalOptions.maxAttempts
      ) {
        throw error;
      }

      console.warn(`Tentativa ${attempt} falhou:`, {
        error,
        nextRetryIn: delay,
        timestamp: new Date().toISOString()
      });

      // Espera antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, delay));

      // Calcula o próximo delay com backoff exponencial
      delay = Math.min(
        delay * finalOptions.backoffFactor,
        finalOptions.maxDelay
      );
    }
  }

  // Não deveria chegar aqui, mas por segurança
  throw lastError || new Error('Todas as tentativas falharam');
}
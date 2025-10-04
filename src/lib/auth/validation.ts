import { z } from 'zod';

// Schema para validação dos dados de login
export const loginDataSchema = z.object({
  usuario_id: z.string().uuid({
    message: 'ID do usuário inválido'
  }),
  ip: z.string().min(1, {
    message: 'IP é obrigatório'
  }).max(45, {
    message: 'IP muito longo'
  }),
  navegador: z.string().min(1, {
    message: 'Informação do navegador é obrigatória'
  }).max(500, {
    message: 'Informação do navegador muito longa'
  })
});

export type LoginData = z.infer<typeof loginDataSchema>;

// Função para validar os dados de login
export function validateLoginData(data: unknown): { 
  success: boolean; 
  data?: LoginData; 
  error?: { message: string; details?: unknown } 
} {
  try {
    const validatedData = loginDataSchema.parse(data);
    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          message: 'Dados de login inválidos',
          details: error.issues
        }
      };
    }
    return {
      success: false,
      error: {
        message: 'Erro ao validar dados de login',
        details: error
      }
    };
  }
}
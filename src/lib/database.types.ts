export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          categoria: string
          nome: string
          email: string
          cpf: string
          criado_em: string
        }
        Insert: {
          id?: string
          categoria: string
          nome: string
          email: string
          cpf: string
          criado_em?: string
        }
        Update: {
          id?: string
          categoria?: string
          nome?: string
          email?: string
          cpf?: string
          criado_em?: string
        }
      }
      logins: {
        Row: {
          id: string
          usuario_id: string
          login_em: string
          logout_em: string | null
          tempo_logado: number | null
          ip: string | null
          navegador: string | null
        }
        Insert: {
          id?: string
          usuario_id: string
          login_em?: string
          logout_em?: string | null
          tempo_logado?: number | null
          ip?: string | null
          navegador?: string | null
        }
        Update: {
          id?: string
          usuario_id?: string
          login_em?: string
          logout_em?: string | null
          tempo_logado?: number | null
          ip?: string | null
          navegador?: string | null
        }
      }
      links: {
        Row: {
          id: string
          tipo: 'transmissao' | 'programacao'
          url: string
          ativo_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          tipo: 'transmissao' | 'programacao'
          url: string
          ativo_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          tipo?: 'transmissao' | 'programacao'
          url?: string
          ativo_em?: string
          atualizado_em?: string
        }
      }
      abas: {
        Row: {
          id: string
          nome: string
          habilitada: boolean
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          nome: string
          habilitada?: boolean
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          nome?: string
          habilitada?: boolean
          criado_em?: string
          atualizado_em?: string
        }
      }
    }
  }
}

export interface UserMetadata {
  id_usuario: number;
  nome: string;
  email: string;
  cpf: string;
  categoria: string;
}

export type Role = 'admin' | 'user';

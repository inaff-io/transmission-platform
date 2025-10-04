export interface Usuario {
  id: string;
  categoria: string;  // 'admin' ou 'user'
  nome: string;
  email: string;
  cpf: string;
  criado_em: string;
}

export interface Link {
  id: string;
  tipo: 'transmissao' | 'programacao';
  url: string;
  ativo_em: string;
  atualizado_em: string;
}

export interface Aba {
  id: string;
  nome: string;
  habilitada: boolean;
  criado_em: string;
  atualizado_em: string;
}

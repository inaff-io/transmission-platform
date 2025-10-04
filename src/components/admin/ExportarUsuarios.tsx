import { Button } from '@/components/ui/Button';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

import type { Usuario as UsuarioType } from '@/types/database';

interface ExportarUsuariosProps {
  usuarios: UsuarioType[];
}



export function ExportarUsuarios({ usuarios }: ExportarUsuariosProps) {
  const handleExport = () => {
    // Preparar os dados para exportação
    const data = usuarios.map(usuario => ({
      Nome: usuario.nome,
      Email: usuario.email,
      CPF: usuario.cpf,
      Categoria: usuario.categoria || '',
      'Data de Cadastro': new Date(usuario.criado_em).toLocaleDateString('pt-BR'),
    }));

    // Criar uma nova planilha
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuários');

    // Gerar o arquivo e fazer o download
    XLSX.writeFile(wb, 'usuarios.xlsx');
  };

  return (
    <Button
      onClick={handleExport}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      Exportar para Excel
    </Button>
  );
}
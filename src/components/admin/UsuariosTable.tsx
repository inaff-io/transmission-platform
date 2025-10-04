'use client';

import { useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getPaginationRowModel,
} from '@tanstack/react-table';
import { Usuario } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const columnHelper = createColumnHelper<Usuario>();

const columns = [
  columnHelper.accessor('nome', {
    header: 'Nome',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('cpf', {
    header: 'CPF',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('categoria', {
    header: 'Categoria',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('criado_em', {
    header: 'Data de Cadastro',
    cell: info => {
      const date = info.getValue();
      if (!date) return '-';
      return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    },
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Ações',
    cell: props => {
      const usuario = props.row.original;
      return (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => props.table.options.meta?.onEdit?.(usuario)}
          >
            Editar
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => props.table.options.meta?.onDelete?.(usuario)}
          >
            Excluir
          </Button>
        </div>
      );
    },
  }),
];

declare module '@tanstack/react-table' {
  interface TableMeta<TData> {
    onEdit?: (usuario: TData) => void;
    onDelete?: (usuario: TData) => void;
  }
}

interface UsuariosTableProps {
  data: Usuario[];
  onEdit?: (usuario: Usuario) => void;
  onDelete?: (usuario: Usuario) => void;
}

export function UsuariosTable({ data, onEdit, onDelete }: UsuariosTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    meta: {
      onEdit,
      onDelete,
    },
  });

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próxima
          </Button>
        </div>
        <div className="text-sm text-gray-700">
          Página {table.getState().pagination.pageIndex + 1} de{' '}
          {table.getPageCount()}
        </div>
      </div>
    </div>
  );
}
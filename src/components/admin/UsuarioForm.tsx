import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';


const usuarioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  cpf: z.string().min(1, 'CPF é obrigatório'),
  categoria: z.string().optional(),
});

type UsuarioFormData = z.infer<typeof usuarioSchema>;

interface UsuarioFormProps {
  usuario?: {
    id: string;
    nome: string;
    email: string;
    cpf: string;
    categoria?: string;
  };
  onSubmit: (data: UsuarioFormData) => Promise<void>;
}

export function UsuarioForm({ usuario, onSubmit }: UsuarioFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: usuario || {},
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
          Nome
        </label>
        <Input
          id="nome"
          type="text"
          {...register('nome')}
          className={errors.nome ? 'border-red-500' : ''}
        />
        {errors.nome && (
          <p className="mt-1 text-sm text-red-500">{errors.nome.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">
          CPF
        </label>
        <Input
          id="cpf"
          type="text"
          {...register('cpf')}
          placeholder="000.000.000-00 ou 11 dígitos"
          inputMode="numeric"
          className={errors.cpf ? 'border-red-500' : ''}
        />
        {errors.cpf && (
          <p className="mt-1 text-sm text-red-500">{errors.cpf.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="categoria" className="block text-sm font-medium text-gray-700">
          Categoria
        </label>
        <Controller
          name="categoria"
          control={control}
          render={({ field }) => (
            <Select value={field.value ?? ''} onValueChange={(val) => field.onChange(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="user">Usuário</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.categoria && (
          <p className="mt-1 text-sm text-red-500">{errors.categoria.message as string}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Salvando...' : usuario ? 'Atualizar' : 'Criar'}
      </Button>
    </form>
  );
}
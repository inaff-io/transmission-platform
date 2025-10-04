import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const preLoginSchema = z.object({
  identifier: z.string()
    .refine(val => {
      // Validar se é email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      // Validar se é CPF (apenas números, 11 dígitos)
      const cpfRegex = /^\d{11}$/;
      return emailRegex.test(val) || cpfRegex.test(val);
    }, 'Digite um e-mail ou CPF válido')
});

type PreLoginFormData = z.infer<typeof preLoginSchema>;

export function PreLoginForm({ onSubmit }: { onSubmit: (data: PreLoginFormData) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<PreLoginFormData>({
    resolver: zodResolver(preLoginSchema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
          E-mail ou CPF
        </label>
        <input
          type="text"
          id="identifier"
          {...register('identifier')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="Digite seu e-mail ou CPF"
        />
        {errors.identifier && (
          <p className="mt-1 text-sm text-red-600">{errors.identifier.message}</p>
        )}
      </div>

      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Continuar
      </button>
    </form>
  );
}

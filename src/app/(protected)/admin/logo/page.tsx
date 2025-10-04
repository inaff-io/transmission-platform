'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import Image from 'next/image';
import { useCleanRscParams } from '@/hooks/useCleanRscParams';

export default function LogoAdmin() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    process.env.NEXT_PUBLIC_BASE_URL 
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/logo-evento.png` 
      : '/logo-evento.png'
  );
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Remove RSC parameters from URL when component mounts
  useCleanRscParams();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    
    if (file) {
      // Preview da imagem
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Por favor, selecione uma imagem para enviar.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // Cria um FormData para enviar o arquivo
      const formData = new FormData();
      formData.append('logo', selectedFile);

      const response = await fetch('/api/logo/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Erro ao enviar o logo';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } else {
            // Se não for JSON, tenta pegar o texto
            const errorText = await response.text();
            if (errorText) {
              errorMessage = `Erro ${response.status}: ${response.statusText}`;
            }
          }
        } catch (e) {
          // Se falhar ao parsear, usa mensagem padrão
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setSuccess(result.message || 'Logo atualizado com sucesso!');
    } catch (error) {
      setError((error as Error).message || 'Erro ao enviar o logo. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AdminLayout>
      <Panel>
        <Panel.Header>
          <Panel.Title>Gerenciar Logo</Panel.Title>
        </Panel.Header>
        <Panel.Content>
          <div className="space-y-8">
          {/* Preview do Logo */}
          <div className="flex flex-col items-center space-y-4">
            <h3 className="text-lg font-semibold">Logo Atual</h3>
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="relative w-[300px] h-[200px]">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Preview do Logo"
                    className="object-contain"
                    fill
                    sizes="300px"
                    onError={() => {
                      // Se falhar ao carregar, mostra fallback
                      setPreviewUrl('/window.svg');
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                    Sem logo
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upload do Logo */}
          <div className="flex flex-col items-center space-y-4">
            <h3 className="text-lg font-semibold">Atualizar Logo</h3>
            <div className="flex flex-col items-center space-y-4 w-full max-w-md">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                variant="outline"
                className="w-full"
              >
                Selecionar Arquivo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="Selecionar arquivo de logo"
                title="Selecionar arquivo de logo"
              />
              {selectedFile && (
                <div className="text-sm text-gray-500">
                  Arquivo selecionado: {selectedFile.name}
                </div>
              )}
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                loading={isUploading}
                className="w-full"
              >
                {isUploading ? 'Enviando...' : 'Enviar Logo'}
              </Button>
            </div>
          </div>

          {/* Mensagens de Erro/Sucesso */}
          {error && (
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}</div>
        </Panel.Content>
      </Panel>   </AdminLayout>
  );
}
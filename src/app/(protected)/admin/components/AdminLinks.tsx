'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Database } from '@/lib/database.types';
import { VimeoPlayer } from '@/components/VimeoPlayer';
import { YouTubePlayer } from '@/components/player/YouTubePlayer';

// Função para extrair o ID do vídeo do Vimeo
const getVimeoId = (url: string): string => {
  try {
    const vimeoUrl = new URL(url);
    
    // Tenta extrair ID do evento
    const eventId = vimeoUrl.pathname.split('/event/')[1]?.split('/')[0];
    if (eventId) return eventId;
    
    // Se não for evento, extrai ID normal do vídeo
    const videoId = vimeoUrl.pathname.split('/')[1];
    if (videoId) return videoId;
    
    return '';
  } catch {
    return '';
  }
};

// Função para extrair o ID do vídeo do YouTube
const getYouTubeId = (url: string): string => {
  try {
    const youtubeUrl = new URL(url);
    
    // Formato: youtube.com/watch?v=VIDEO_ID
    if (youtubeUrl.pathname === '/watch') {
      return youtubeUrl.searchParams.get('v') || '';
    }
    
    // Formato: youtu.be/VIDEO_ID
    if (youtubeUrl.hostname === 'youtu.be') {
      return youtubeUrl.pathname.slice(1);
    }
    
    // Formato: youtube.com/embed/VIDEO_ID
    if (youtubeUrl.pathname.startsWith('/embed/')) {
      return youtubeUrl.pathname.split('/embed/')[1];
    }
    
    return '';
  } catch {
    return '';
  }
};

// Função para identificar o tipo de vídeo
const getVideoType = (url: string): 'vimeo' | 'youtube' | 'html' | null => {
  try {
    const videoUrl = new URL(url);
    if (videoUrl.hostname.includes('vimeo.com')) return 'vimeo';
    if (videoUrl.hostname.includes('youtube.com') || videoUrl.hostname === 'youtu.be') return 'youtube';
    return null;
  } catch {
    if (url.trim().startsWith('<div') || url.trim().startsWith('<iframe')) return 'html';
    return null;
  }
};

const linkSchema = z.object({
  tipo: z.enum(['transmissao', 'programacao']),
  url: z.string().superRefine((val, ctx) => {
    const trimmed = val.trim();

    // Permite snippets de HTML diretamente
    if (trimmed.startsWith('<div') || trimmed.startsWith('<iframe')) {
      return; // válido, nenhuma issue
    }

    try {
      // Valida se é uma URL válida
      // eslint-disable-next-line no-new
      new URL(trimmed);

      // Para transmissão, apenas Vimeo/YouTube são aceitos
      if ((ctx as any).parent?.tipo === 'transmissao') {
        const videoType = getVideoType(trimmed);
        if (!videoType) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Para transmissão, apenas URLs do Vimeo ou YouTube são aceitas',
          });
        }
      }

      // Para programação, qualquer URL válida é aceita (nenhuma issue)
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Por favor, insira uma URL válida ou um código de incorporação HTML',
      });
    }
  }),
});

type LinkFormData = z.infer<typeof linkSchema>;

type Link = {
  id: string;
  tipo: 'transmissao' | 'programacao';
  url: string;
  url_original?: string;
  titulo?: string;
  created_at: string;
  ativo_em?: string | null;
};

export default function AdminLinks() {
  const [links, setLinks] = useState<Link[]>([]);
  const [selectedLink, setSelectedLink] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<LinkFormData>({
    resolver: zodResolver(linkSchema),
  });

  useEffect(() => {
    try {
      bcRef.current = new BroadcastChannel('transmission_updates');
    } catch {}
    return () => {
      try { bcRef.current?.close(); } catch {}
      bcRef.current = null;
    };
  }, []);

  const loadLinks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/links', { credentials: 'include', keepalive: true, cache: 'no-store' });
      if (!response.ok) throw new Error('Erro ao carregar links');
      const data = await response.json();
      // Garante que links seja sempre um array
      setLinks(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Erro ao carregar links:', error);
      setError('Erro ao carregar links. Por favor, tente novamente.');
      // Em caso de erro, inicializa com array vazio
      setLinks([]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: LinkFormData) => {
    try {
      setError(null);
      console.log('Enviando dados:', data);
      const response = await fetch('/api/admin/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
        keepalive: true,
        cache: 'no-store'
      });
  
      let responseData;
      try {
        responseData = await response.json();
        console.log('Resposta da API:', responseData);
      } catch (e) {
        console.error('Erro ao ler resposta da API:', e);
        throw new Error('Erro ao processar resposta do servidor');
      }
      
      if (!response.ok) {
        const errorMessage = responseData && typeof responseData === 'object' && 'error' in responseData
          ? String(responseData.error)
          : 'Erro ao salvar link';
        throw new Error(errorMessage);
      }
      
      reset();
      loadLinks();
      // Notifica a transmissão sobre atualização de links
      try { bcRef.current?.postMessage({ type: 'links_updated', payload: responseData }); } catch {}
    } catch (error) {
      console.error('Erro ao salvar link:', error);
      setError(error instanceof Error ? error.message : 'Erro ao salvar link');
    }
  };

  const onDelete = async (id: string, tipo: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/admin/links?id=${id}&tipo=${tipo}`, {
        method: 'DELETE',
        credentials: 'include',
        keepalive: true,
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao deletar link');
      }
      
      loadLinks();
      // Notifica a transmissão sobre atualização de links
      try { bcRef.current?.postMessage({ type: 'links_updated', payload: { id, tipo, action: 'delete' } }); } catch {}
    } catch (error) {
      console.error('Erro ao deletar link:', error);
      setError(error instanceof Error ? error.message : 'Erro ao deletar link');
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  useEffect(() => {
    if (links.length > 0) {
      const activeLink = links.find(link => link.ativo_em !== null);
      if (activeLink) {
        setSelectedLink(activeLink.url);
      }
    }
  }, [links]);

  const renderVideoPlayer = (url: string) => {
    // Se a URL já é um código HTML, renderiza diretamente
    if (url.trim().startsWith('<div') || url.trim().startsWith('<iframe')) {
      return (
        <div className="aspect-video">
          <div dangerouslySetInnerHTML={{ __html: url }} />
        </div>
      );
    }

    const videoType = getVideoType(url);

    switch (videoType) {
      case 'vimeo':
        const vimeoId = getVimeoId(url);
        if (!vimeoId) {
          return (
            <div className="aspect-video flex items-center justify-center bg-gray-100 border rounded-lg">
              <p className="text-gray-500">ID do vídeo do Vimeo não encontrado</p>
            </div>
          );
        }
        return <VimeoPlayer videoId={vimeoId} />;

      case 'youtube':
        const videoId = getYouTubeId(url);
        if (!videoId) {
          return (
            <div className="aspect-video flex items-center justify-center bg-gray-100 border rounded-lg">
              <p className="text-gray-500">ID do vídeo do YouTube não encontrado</p>
            </div>
          );
        }
        return <YouTubePlayer videoId={videoId} />;

      case 'html':
        return (
          <div className="aspect-video">
            <div dangerouslySetInnerHTML={{ __html: url }} />
          </div>
        );

      default:
        // Se não é um vídeo, tenta exibir como iframe normal
        try {
          const urlObj = new URL(url);
          return (
            <div className="aspect-video">
              <iframe
                src={urlObj.href}
                className="w-full h-full"
                frameBorder="0"
                allowFullScreen
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                referrerPolicy="no-referrer"
              />
            </div>
          );
        } catch {
          // Se não é uma URL válida, tenta renderizar como HTML
          if (url.includes('<iframe')) {
            return (
              <div className="aspect-video">
                <div dangerouslySetInnerHTML={{ __html: url }} />
              </div>
            );
          }
          return (
            <div className="aspect-video flex items-center justify-center bg-gray-100 border rounded-lg">
              <p className="text-gray-500">URL inválida</p>
            </div>
          );
        }
    }
  };

  const currentUrl = watch('url');
  const previewUrl = currentUrl && getVideoType(currentUrl) !== null ? currentUrl : null;

  return (
    <div className="space-y-4">
      {/* Preview do link atual */}
      <div className="mt-4" ref={previewContainerRef}>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Visualização do Link Ativo
        </h3>
        <div className="border rounded-lg overflow-hidden">
          {selectedLink ? renderVideoPlayer(selectedLink) : (
            <div className="aspect-video flex items-center justify-center bg-gray-100 border rounded-lg">
              <p className="text-gray-500">Nenhum vídeo selecionado</p>
            </div>
          )}
        </div>
      </div>

      {/* Lista de Links Ativos */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">Links Ativos</h3>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {loading ? (
            <div className="p-4 text-center">
              <p className="text-gray-500">Carregando links...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-red-500">{error}</p>
              <button
                onClick={() => loadLinks()}
                className="mt-2 text-blue-600 hover:text-blue-500"
              >
                Tentar novamente
              </button>
            </div>
          ) : links.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-gray-500">Nenhum link cadastrado</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {links.map((link) => (
                <li key={link.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {link.titulo || (link.tipo === 'transmissao' ? 'Transmissão' : 'Programação')}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {(() => {
                          // Se a URL é um iframe HTML, extrai apenas o src
                          if (link.url.trim().startsWith('<iframe')) {
                            const match = link.url.match(/src="([^"]+)"/);
                            const srcUrl = match ? match[1] : link.url;
                            return srcUrl.length > 100 ? srcUrl.substring(0, 100) + '...' : srcUrl;
                          }
                          return link.url.length > 100 ? link.url.substring(0, 100) + '...' : link.url;
                        })()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(link.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedLink(link.url)}
                        className="font-medium text-blue-600 hover:text-blue-500"
                      >
                        Visualizar
                      </button>
                      <button
                        onClick={() => onDelete(link.id, link.tipo)}
                        className="font-medium text-red-600 hover:text-red-500"
                      >
                        Deletar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Formulário para adicionar novo link */}
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900">Adicionar Novo Link</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tipo
            </label>
            <select
              {...register('tipo')}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="transmissao">Transmissão</option>
              <option value="programacao">Programação</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              URL ou Código de Incorporação
            </label>
            <input
              type="text"
              {...register('url')}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="https://vimeo.com/... ou https://youtube.com/... ou <div>...</div>"
            />
            {errors.url && (
              <p className="mt-2 text-sm text-red-600">
                {errors.url.message}
              </p>
            )}
          </div>

          {/* Preview do link sendo adicionado */}
          {previewUrl && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Pré-visualização
              </h4>
              <div className="border rounded-lg overflow-hidden">
                {renderVideoPlayer(previewUrl)}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

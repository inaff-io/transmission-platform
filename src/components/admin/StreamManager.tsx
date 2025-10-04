'use client';

import { useState, useEffect } from 'react';

interface StreamManagerProps {
  onStreamUpdate?: (url: string, platform: string, isOnline: boolean) => void;
}

const detectPlatform = (url: string): 'generic' => {
  return 'generic';
};

export default function StreamManager({ onStreamUpdate }: StreamManagerProps) {
  const [streamUrl, setStreamUrl] = useState('');
  const [platform, setPlatform] = useState<'youtube' | 'vimeo' | 'generic'>('generic');
  const [isOnline, setIsOnline] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    if (streamUrl) {
      const detectedPlatform = detectPlatform(streamUrl);
      setPlatform(detectedPlatform);
      onStreamUpdate?.(streamUrl, detectedPlatform, isOnline);
    }
  }, [streamUrl, isOnline, onStreamUpdate]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setStreamUrl(url);
  };

  const handleActivateStream = async () => {
    if (!streamUrl) return;
    
    setIsActivating(true);
    try {
      // Simular ativação da transmissão
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsOnline(true);
    } catch (error) {
      console.error('Erro ao ativar transmissão:', error);
    } finally {
      setIsActivating(false);
    }
  };

  const handleDeactivateStream = () => {
    setIsOnline(false);
  };

  const renderIframe = () => {
    if (!streamUrl) return null;

    const commonProps = {
      width: "560",
      height: "315",
      src: streamUrl,
      title: "Stream Player",
      className: "w-full rounded-lg shadow-lg"
    };

    switch (platform) {
      case 'youtube':
        return (
          <iframe
            {...commonProps}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        );
      case 'vimeo':
        return (
          <iframe
            {...commonProps}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        );
      default:
        return (
          <iframe
            {...commonProps}
            allowFullScreen
          />
        );
    }
  };

  const getPlatformBadge = () => {
    const badges = {
      youtube: 'bg-red-100 text-red-800',
      vimeo: 'bg-blue-100 text-blue-800',
      generic: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[platform]}`}>
        {platform.charAt(0).toUpperCase() + platform.slice(1)}
      </span>
    );
  };

  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🔴</span>
        <h2 className="text-xl font-bold text-red-800">Gerenciador de Transmissão</h2>
        {isOnline && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
            AO VIVO
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="stream-url" className="block text-sm font-medium text-red-700 mb-2">
            URL da Transmissão
          </label>
          <div className="flex gap-2">
            <input
              id="stream-url"
              type="url"
              value={streamUrl}
              onChange={handleUrlChange}
              placeholder="https://exemplo.com/transmissao"
              className="flex-1 px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            {streamUrl && getPlatformBadge()}
          </div>
        </div>

        <div className="flex gap-3">
          {!isOnline ? (
            <button
              onClick={handleActivateStream}
              disabled={!streamUrl || isActivating}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isActivating ? 'Ativando...' : 'Ativar Transmissão'}
            </button>
          ) : (
            <button
              onClick={handleDeactivateStream}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Desativar Transmissão
            </button>
          )}
        </div>

        {streamUrl && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-red-700 mb-2">Pré-visualização</h3>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {renderIframe()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
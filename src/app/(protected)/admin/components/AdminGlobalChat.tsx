'use client';

import { useEffect, useState } from 'react'
import ChatSystem from '@/components/ChatSystem'

interface MeResponse {
  id: string
  nome: string
  email: string
  categoria: string
}

export default function AdminGlobalChat() {
  const [me, setMe] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  // Abre por padrão para administradores visualizarem imediatamente
  const [isOpen, setIsOpen] = useState(true)
  
  const handleClearAll = async () => {
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'DELETE',
        credentials: 'include',
        cache: 'no-store'
      });
      if (!res.ok) {
        console.error('Falha ao limpar conversas');
        return;
      }
      // Gatilho para recarregar mensagens imediatamente
      window.dispatchEvent(new Event('chat:refresh'));
    } catch (e) {
      console.error('Erro ao limpar conversas', e);
    }
  }

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (!res.ok) throw new Error('Unauthorized')
        const data = await res.json()
        setMe(data)
      } catch (e) {
        setMe(null)
      } finally {
        setLoading(false)
      }
    }
    loadMe()
  }, [])

  const userName = me?.nome || me?.email || 'Usuário'
  const canModerate = (me?.categoria || '').toLowerCase() === 'admin'

  if (loading) {
    return (
      <div className="p-4 text-sm text-gray-600">Carregando seu perfil...</div>
    )
  }

  if (!me) {
    return (
      <div className="p-4 text-sm text-red-600">Você não está autenticado.</div>
    )
  }

  // Bate-papo habilitado para administradores
  return (
    <div className="space-y-2">
      {canModerate && (
        <div className="flex items-center justify-end">
          <button
            onClick={handleClearAll}
            className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700"
            title="Limpar todas as conversas"
          >
            Limpar conversas
          </button>
        </div>
      )}
      <ChatSystem
        isVisible={isOpen}
        onToggle={() => setIsOpen(prev => !prev)}
        userName={userName}
        currentUserId={me?.id}
        canModerate={canModerate}
        variant="panel"
      />
    </div>
  )
}
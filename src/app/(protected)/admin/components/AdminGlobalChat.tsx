'use client'

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
  const [isOpen, setIsOpen] = useState(true)

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
    <ChatSystem
      isVisible={isOpen}
      onToggle={() => setIsOpen(prev => !prev)}
      userName={userName}
      canModerate={canModerate}
      variant="panel"
    />
  )
}
'use client'

import React from 'react'
import { VimeoPlayer } from '@/components/VimeoPlayer'
import { YouTubePlayer } from '@/components/YouTubePlayer'

type Props = {
  url: string
  className?: string
}

function getYouTubeId(url: string): string {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1)
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtube-nocookie.com')) {
      if (u.pathname === '/watch') return u.searchParams.get('v') || ''
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/embed/')[1] || ''
      if (u.pathname.startsWith('/live/')) return u.pathname.split('/live/')[1] || ''
    }
    return ''
  } catch {
    // raw ID?
    return /^[a-zA-Z0-9_-]{11}$/.test(url) ? url : ''
  }
}

function getVimeoId(url: string): string {
  try {
    const u = new URL(url)
    // vimeo.com/event/12345 or vimeo.com/12345
    const eventId = u.pathname.split('/event/')[1]?.split('/')[0]
    if (eventId) return eventId
    const parts = u.pathname.split('/')
    return parts[1] || ''
  } catch {
    return ''
  }
}

function getType(url: string): 'youtube' | 'vimeo' | 'html' | 'url' | null {
  const t = url.trim()
  if (t.startsWith('<div') || t.startsWith('<iframe')) return 'html'
  try {
    const u = new URL(t)
    if (u.hostname.includes('vimeo.com')) return 'vimeo'
    if (u.hostname.includes('youtube.com') || u.hostname === 'youtu.be' || u.hostname.includes('youtube-nocookie.com')) return 'youtube'
    return 'url'
  } catch {
    return null
  }
}

export default function ReprisePlayer({ url, className = 'w-full aspect-video' }: Props) {
  const type = getType(url)

  if (!type) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 border rounded-lg ${className}`}>
        <p className="text-gray-500">Link inválido</p>
      </div>
    )
  }

  if (type === 'html') {
    return (
      <div className={className}>
        <div dangerouslySetInnerHTML={{ __html: url }} />
      </div>
    )
  }

  if (type === 'youtube') {
    const id = getYouTubeId(url)
    if (!id) {
      return (
        <div className={`flex items-center justify-center bg-gray-100 border rounded-lg ${className}`}>
          <p className="text-gray-500">ID do YouTube não encontrado</p>
        </div>
      )
    }
    return (
      <div className={`relative ${className}`}>
        <YouTubePlayer videoId={id} />
        {/* Overlay transparente para bloquear cliques e desabilitar botões de play do YouTube */}
        <div
          className="absolute inset-0 z-[1000] bg-transparent"
          style={{ pointerEvents: 'auto', cursor: 'not-allowed' }}
          title="Interações desabilitadas"
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
        />
      </div>
    )
  }

  if (type === 'vimeo') {
    const id = getVimeoId(url)
    if (!id) {
      return (
        <div className={`flex items-center justify-center bg-gray-100 border rounded-lg ${className}`}>
          <p className="text-gray-500">ID do Vimeo não encontrado</p>
        </div>
      )
    }
    return <VimeoPlayer videoId={id} className={className} />
  }

  // Generic URL: render iframe
  try {
    const u = new URL(url)
    return (
      <div className={className}>
        <iframe
          src={u.href}
          className="w-full h-full"
          frameBorder={0}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>
    )
  } catch {
    return (
      <div className={`flex items-center justify-center bg-gray-100 border rounded-lg ${className}`}>
        <p className="text-gray-500">URL inválida</p>
      </div>
    )
  }
}
'use client'

import React, { useEffect, useRef, useState } from 'react'

type YTPlayer = any

export interface LockedYouTubePlayerProps {
  videoUrlOrId: string
  className?: string
  onRequireAudioActivation?: () => void
}

// Extracts a YouTube video ID from common URL formats or returns the input if it looks like an ID
function getYouTubeId(input: string): string | null {
  try {
    // If it looks like a raw ID (11 characters, letters/digits/_/-), return it
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
      return input
    }

    const url = new URL(input)
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      // https://youtube.com/watch?v=VIDEO_ID
      if (url.pathname === '/watch') {
        const v = url.searchParams.get('v')
        return v || null
      }
      // https://youtube.com/embed/VIDEO_ID
      if (url.pathname.startsWith('/embed/')) {
        const parts = url.pathname.split('/')
        return parts[2] || null
      }
      // https://youtube.com/live/VIDEO_ID
      if (url.pathname.startsWith('/live/')) {
        const parts = url.pathname.split('/')
        return parts[2] || null
      }
    }

    if (host === 'youtu.be') {
      // https://youtu.be/VIDEO_ID
      const parts = url.pathname.split('/')
      return parts[1] || null
    }

    return null
  } catch {
    // not a valid URL, maybe it's an ID
    return /^[a-zA-Z0-9_-]{11}$/.test(input) ? input : null
  }
}

// Loads the YouTube IFrame API safely in client-side only
function loadYouTubeAPI(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  const w = window as any

  // If already loaded
  if (w.YT && w.YT.Player) {
    return Promise.resolve()
  }

  // Prevent multiple loads with a shared promise
  if (w.__ytApiPromise) {
    return w.__ytApiPromise
  }

  w.__ytApiPromise = new Promise<void>((resolve) => {
    const existing = document.getElementById('youtube-iframe-api') as HTMLScriptElement | null
    if (!existing) {
      const tag = document.createElement('script')
      tag.id = 'youtube-iframe-api'
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }

    // The API will call this when it's ready
    const prev = w.onYouTubeIframeAPIReady
    w.onYouTubeIframeAPIReady = () => {
      if (typeof prev === 'function') prev()
      resolve()
    }

    // If YT becomes available before onYouTubeIframeAPIReady fires (rare), resolve
    const checkInterval = setInterval(() => {
      if (w.YT && w.YT.Player) {
        clearInterval(checkInterval)
        resolve()
      }
    }, 50)
  })

  return w.__ytApiPromise
}

export default function LockedYouTubePlayer({ videoUrlOrId, className, onRequireAudioActivation }: LockedYouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const [ready, setReady] = useState(false)
  const [volume, setVolume] = useState(50)
  const [videoId, setVideoId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const fadeTimerRef = useRef<number | null>(null)
  const pauseTimeoutRef = useRef<number | null>(null)
  // Discreet volume UI state
  const [showVolPanel, setShowVolPanel] = useState(false)
  const [lastNonZeroVol, setLastNonZeroVol] = useState(50)
  const interactedRef = useRef(false)
  const YT_STATE_PLAYING = 1

  const ensureIframeAttributes = () => {
    const iframe = containerRef.current?.querySelector('iframe') as HTMLIFrameElement | null
    if (!iframe) return
    try {
      iframe.setAttribute('allow', 'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share')
      iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin')
      // playsinline attributes help iOS Safari avoid fullscreen
      iframe.setAttribute('playsinline', '')
      iframe.setAttribute('webkit-playsinline', '')
    } catch {}
  }

  const attemptAudioAutoplay = (prevVol?: number) => {
    const player = playerRef.current as any
    if (!player) return

    let target = typeof prevVol === 'number' && !Number.isNaN(prevVol) ? prevVol : (volume ?? 50)
    target = Math.max(0, Math.min(100, target))

    try {
      // Start playback muted to satisfy autoplay policies
      if (typeof player.setVolume === 'function') player.setVolume(0)
      player.mute?.()
      player.playVideo?.()
      setIsPlaying(true)
    } catch {}

    // Ensure iframe attributes are set correctly
    try { ensureIframeAttributes() } catch {}

    // If user has already interacted, restore volume smoothly
    if (interactedRef.current) {
      setVolume(target)
      fadeVolume(target, 800)
      try { player.unMute?.() } catch {}
      return
    }

    // No interaction yet: keep muted, briefly show volume panel, notify UI
    try { player.mute?.() } catch {}
    setShowVolPanel(true)
    window.setTimeout(() => setShowVolPanel(false), 1500)
    try { onRequireAudioActivation?.() } catch {}

    // Observe for a few seconds if the user interacts, then restore audio
    const startedAt = Date.now()
    const checkInteraction = () => {
      if (interactedRef.current) {
        setVolume(target)
        fadeVolume(target, 800)
        try { player.unMute?.() } catch {}
        return
      }
      if (Date.now() - startedAt < 4000) {
        window.setTimeout(checkInteraction, 300)
      }
    }
    window.setTimeout(checkInteraction, 300)
  }

  const clearFade = () => {
    if (fadeTimerRef.current) {
      clearInterval(fadeTimerRef.current)
      fadeTimerRef.current = null
    }
  }

  const fadeVolume = (to: number, duration = 800) => {
    clearFade()
    const player = playerRef.current as any
    if (!player) return
    let start = 0
    try {
      start = typeof player.getVolume === 'function' ? player.getVolume() : 0
    } catch {
      start = 0
    }
    const steps = Math.max(1, Math.floor(duration / 50))
    const delta = (to - start) / steps
    let currentStep = 0
    fadeTimerRef.current = window.setInterval(() => {
      currentStep++
      const value = Math.round(start + delta * currentStep)
      try {
        player.setVolume(Math.max(0, Math.min(100, value)))
        if (value > 0) player.unMute()
        else player.mute()
      } catch {}
      if (currentStep >= steps) {
        clearFade()
        try {
          player.setVolume(to)
          if (to > 0) player.unMute()
        } catch {}
      }
    }, 50)
  }

  // Resolve video ID from URL or ID
  useEffect(() => {
    setVideoId(getYouTubeId(videoUrlOrId))
  }, [videoUrlOrId])

  // Persistência de volume e restauração ao carregar
  useEffect(() => {
    try {
      const storedVol = Number(localStorage.getItem('yt_volume') ?? '50')
      const storedLast = Number(localStorage.getItem('yt_last_non_zero') ?? '50')
      const safeVol = Math.max(0, Math.min(100, Number.isNaN(storedVol) ? 50 : storedVol))
      const safeLast = Math.max(0, Math.min(100, Number.isNaN(storedLast) ? 50 : storedLast))
      setVolume(safeVol)
      setLastNonZeroVol(safeLast > 0 ? safeLast : (safeVol > 0 ? safeVol : 50))
    } catch {}
  }, [])
  useEffect(() => {
    try { localStorage.setItem('yt_volume', String(volume)) } catch {}
  }, [volume])
  useEffect(() => {
    try { localStorage.setItem('yt_last_non_zero', String(lastNonZeroVol)) } catch {}
  }, [lastNonZeroVol])

  // Rastreia a primeira interação do usuário para permitir restaurar o volume após autoplay
  useEffect(() => {
    const handler = () => { interactedRef.current = true }
    window.addEventListener('click', handler, { capture: true, once: true })
    window.addEventListener('touchstart', handler, { capture: true, once: true })
    window.addEventListener('keydown', handler, { capture: true, once: true })
    return () => {
      window.removeEventListener('click', handler)
      window.removeEventListener('touchstart', handler)
      window.removeEventListener('keydown', handler)
    }
  }, [])

  // Initialize player when API and container are ready
  useEffect(() => {
    let destroyed = false
    if (typeof window === 'undefined') return
    if (!containerRef.current || !videoId) return

    loadYouTubeAPI().then(() => {
      if (destroyed) return
      const w = window as any
      if (!(w.YT && w.YT.Player)) return

      playerRef.current = new w.YT.Player(containerRef.current, {
        width: '100%',
        height: '100%',
        videoId,
        playerVars: {
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          fs: 0,
          playsinline: 1,
          'webkit-playsinline': 1,
          autoplay: 1,
          iv_load_policy: 3,
          origin: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
        events: {
          onReady: () => {
            if (destroyed) return
            try {
              ensureIframeAttributes()
              attemptAudioAutoplay()
            } catch {}
            setReady(true)
          },
          onError: () => {
            setReady(true)
          },
        },
      })
      window.setTimeout(ensureIframeAttributes, 50)
    })

    return () => {
      destroyed = true
      try {
        playerRef.current?.destroy()
      } catch {}
      playerRef.current = null
    }
  }, [videoId])

  // If video changes after initialization, load new ID
  useEffect(() => {
    if (playerRef.current && videoId) {
      try {
        let prevVol = 0
        try {
          prevVol = typeof playerRef.current.getVolume === 'function' ? playerRef.current.getVolume() : (volume ?? 50)
        } catch {}

        playerRef.current.loadVideoById(videoId)
        ensureIframeAttributes()
        attemptAudioAutoplay(prevVol)
      } catch {}
    }
  }, [videoId])

  const handlePlay = () => {
    try {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current)
        pauseTimeoutRef.current = null
      }
      playerRef.current?.playVideo()
      setIsPlaying(true)
      fadeVolume(volume, 800)
      // briefly show volume panel when starting playback
      setShowVolPanel(true)
      window.setTimeout(() => setShowVolPanel(false), 1200)
    } catch {}
  }

  const handlePause = () => {
    try {
      setIsPlaying(false)
      // fade-out discreto antes de pausar
      fadeVolume(0, 600)
      pauseTimeoutRef.current = window.setTimeout(() => {
        try { playerRef.current?.pauseVideo() } catch {}
      }, 650)
    } catch {}
  }

  const updateVolume = (value: number, duration = 400) => {
    const v = Math.max(0, Math.min(100, Number(value)))
    setVolume(v)
    if (v > 0) setLastNonZeroVol(v)
    try {
      if (isPlaying) {
        // ajuste discreto durante reprodução
        fadeVolume(v, duration)
      } else {
        // se estiver pausado, apenas prepara o volume desejado mantendo mudo
        playerRef.current?.setVolume(v)
        playerRef.current?.mute()
      }
    } catch {}
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateVolume(Number(e.target.value))
  }

  const handleVolumeToggle = () => {
    try {
      if (typeof playerRef.current?.getVolume === 'function') {
        const current = playerRef.current.getVolume?.() ?? volume
        if (current > 0 || volume > 0) {
          // mute
          setLastNonZeroVol(current > 0 ? current : volume)
          setVolume(0)
          fadeVolume(0, 300)
        } else {
          // unmute to last volume (or default 50)
          const target = lastNonZeroVol > 0 ? lastNonZeroVol : 50
          setVolume(target)
          fadeVolume(target, 300)
        }
      } else {
        // fallback using state only
        if (volume > 0) {
          setLastNonZeroVol(volume)
          setVolume(0)
          fadeVolume(0, 300)
        } else {
          const target = lastNonZeroVol > 0 ? lastNonZeroVol : 50
          setVolume(target)
          fadeVolume(target, 300)
        }
      }
    } catch {}
  }

  const handleShowVolPanel = () => setShowVolPanel(true)
  const handleHideVolPanel = () => setShowVolPanel(false)

  // Atalhos de teclado: Espaço (play/pause), M (mute), setas de volume
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase() || ''
      if (tag === 'input' || tag === 'textarea') return
      if (e.key === ' ') {
        e.preventDefault()
        isPlaying ? handlePause() : handlePlay()
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault()
        handleVolumeToggle()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        updateVolume((volume ?? 0) + 5)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        updateVolume((volume ?? 0) - 5)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isPlaying, volume])

  // SSR-safe placeholder
  if (typeof window === 'undefined') {
    return (
      <div className={['relative w-full aspect-video bg-black/80', className].filter(Boolean).join(' ')}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white/80 text-sm">Carregando…</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={[
        'relative w-full aspect-video bg-black',
        className || '',
      ].join(' ')}>
        {/* IFrame container (YouTube will replace this div) */}
        <div ref={containerRef} className="absolute inset-0" style={{ pointerEvents: 'none' }}></div>

        {/* Transparent overlay that blocks any click to the underlying iframe */}
        <div
          className="absolute inset-0 z-[1000000] bg-transparent"
          style={{ pointerEvents: 'auto', cursor: 'not-allowed' }}
          title="Interações bloqueadas"
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
        />

        {/* Loading indicator */}
        {!ready && (
          <div className="absolute inset-0 z-30 flex items-center justify-center">
            <span className="text-white/80 text-sm bg-black/40 px-3 py-1 rounded">Carregando…</span>
          </div>
        )}
      </div>

      {/* Barra de controles fora da área protegida (abaixo) */}
      <div className="mt-2 sm:mt-3 md:mt-4 px-4 sm:px-6 md:px-8 mx-auto max-w-screen-lg">
        <div className="flex items-center gap-4 rounded-lg bg-black/40 backdrop-blur-sm px-4 py-3">
          {/* Volume à esquerda */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleVolumeToggle}
              className="text-white hover:text-blue-300 transition-colors"
              title="Volume"
              aria-label="Alternar mudo"
            >
              🔊
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={handleVolumeChange}
              className="w-44 sm:w-56 md:w-64 h-2 appearance-none rounded bg-white/30"
              style={{ accentColor: '#ffffff' }}
              step={1}
            />
          </div>

          {/* Play/Pause */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePlay}
              className="text-white hover:text-green-300 transition-colors"
              title="Play"
              aria-label="Reproduzir"
              disabled={!ready}
            >
              ▶️
            </button>
            <button
              type="button"
              onClick={handlePause}
              className="text-white hover:text-yellow-300 transition-colors"
              title="Pause"
              aria-label="Pausar"
              disabled={!ready}
            >
              ⏸️
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
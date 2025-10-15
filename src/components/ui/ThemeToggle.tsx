'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme')
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      const enableDark = stored ? stored === 'dark' : prefersDark
      setIsDark(enableDark)
      document.documentElement.classList.toggle('dark', enableDark)
    } catch {}
  }, [])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {}
  }

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      title={isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
    >
      {isDark ? (
        <span className="inline-flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M21.64 13a1 1 0 0 0-1.05-.77 8 8 0 0 1-9.82-9.82 1 1 0 0 0-.77-1.05A10 10 0 1 0 21.64 13z"/></svg>
          Escuro
        </span>
      ) : (
        <span className="inline-flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zM1 13h3v-2H1v2zm10-9h-2v3h2V4zm7.04 1.46l-1.41-1.41-1.8 1.79 1.42 1.42 1.79-1.8zM20 11v2h3v-2h-3zm-9 9h2v-3h-2v3zm4.24-1.84l1.8 1.79 1.41-1.41-1.79-1.8-1.42 1.42zM4.96 18.54l1.41 1.41 1.8-1.79-1.42-1.42-1.79 1.8z"/></svg>
          Claro
        </span>
      )}
    </button>
  )
}
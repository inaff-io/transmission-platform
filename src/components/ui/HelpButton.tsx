'use client'

import { useState, useRef, useEffect } from 'react'
import UIBlock from '@/components/UIBlock'

export default function HelpButton() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!panelRef.current) return
      if (open && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [open])

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        title="Ajuda e suporte"
      >
        <span className="inline-flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm.25 15.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zM12 6a4 4 0 00-4 4h2a2 2 0 114 0c0 1-1 1.5-1.6 1.9-.6.4-.9.6-.9 1.6v.5h2v-.3c0-.7.2-.9.8-1.3.8-.6 1.7-1.1 1.7-2.4A4 4 0 0012 6z"/></svg>
          Ajuda
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 z-50">
          <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">Contato direto</div>
          {/* Conteúdo gerenciado pelo Admin via UIBlock */}
          <div className="text-sm text-gray-700 dark:text-gray-200 space-y-2">
            <UIBlock block="help_contact" className="space-y-2" />
          </div>
          {/* Fallback */}
          <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-2 space-y-2">
            <a href="https://wa.me/557135610260" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs text-green-700 hover:text-green-800 dark:text-green-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.028-.964-.27-.099-.466-.149-.662.149-.197.297-.761.964-.934 1.161-.173.198-.346.223-.643.074-.297-.149-1.255-.463-2.39-1.477-.883-.788-1.48-1.76-1.653-2.058-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.496.099-.198.05-.372-.025-.521-.075-.149-.662-1.597-.908-2.186-.239-.574-.48-.496-.662-.505-.173-.009-.372-.011-.571-.011-.198 0-.52.074-.793.372-.272.297-1.04 1.016-1.04 2.475 0 1.458 1.065 2.868 1.213 3.065.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.718 2.005-1.413.248-.695.248-1.29.173-1.413-.074-.123-.272-.198-.57-.347z"/></svg>
              WhatsApp
            </a>
            <a href="tel:+557135610260" className="inline-flex items-center gap-2 text-xs text-blue-700 hover:text-blue-800 dark:text-blue-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.1.37 2.28.57 3.5.57a1 1 0 011 1V21a1 1 0 01-1 1A17 17 0 013 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.22.2 2.4.57 3.5a1 1 0 01-.24 1.01l-2.2 2.2z"/></svg>
              Telefone
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
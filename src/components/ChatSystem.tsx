'use client'

import { useState, useEffect, useRef } from 'react'

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: Date;
  isSystem?: boolean;
  // novo: metadados
  userId?: string;
  categoria?: string;
}

interface ChatSystemProps {
  isVisible: boolean;
  onToggle: () => void;
  userName: string;
  // novo: modo moderador
  canModerate?: boolean;
  // novo: variante visual
  variant?: 'floating' | 'panel';
}

export default function ChatSystem({ isVisible, onToggle, userName, canModerate = false, variant = 'floating' }: ChatSystemProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  // novo: carregamento
  const [loading, setLoading] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (smooth = false) => {
    const el = messagesContainerRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages]);

  useEffect(() => {
    // Substituir simulação por carga da API
    const loadMessages = async () => {
      try {
        const res = await fetch('/api/chat/messages', { cache: 'no-store', credentials: 'include' });
        if (!res.ok) throw new Error('Falha ao carregar mensagens');
        const data = await res.json();
        const msgs = (data.messages || []).map((m: any) => ({
          id: m.id,
          user: m.userName || 'Usuário',
          message: m.message,
          timestamp: new Date(m.createdAt),
          userId: m.userId,
          categoria: m.categoria,
        })) as ChatMessage[];
        // garantir ordenação cronológica crescente para exibição
        msgs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        setMessages(msgs);
        setIsConnected(true);
      } catch (e) {
        // Em caso de erro, mantenha mensagens existentes e apenas marque desconectado
        setIsConnected(false);
        setMessages(prev => prev.length === 0 ? [{
          id: Date.now().toString(),
          user: 'Sistema',
          message: `Bem-vindo ao chat, ${userName}!`,
          timestamp: new Date(),
          isSystem: true,
        }] : prev);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [userName]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: newMessage.trim() })
      });
      if (!res.ok) throw new Error('Falha ao enviar mensagem');
      const data = await res.json();
      const m = data.message;
      const message: ChatMessage = {
        id: m.id,
        user: m.userName || userName,
        message: m.message,
        timestamp: new Date(m.createdAt),
        userId: m.userId,
        categoria: m.categoria,
      };
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      scrollToBottom(true);
    } catch {
      // fallback: adiciona localmente
      const message: ChatMessage = {
        id: Date.now().toString(),
        user: userName,
        message: newMessage.trim(),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      scrollToBottom(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canModerate) return;
    try {
      const res = await fetch(`/api/chat/messages/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao remover mensagem');
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch {}
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isVisible) {
    if (variant === 'floating') {
      return (
        <button
          onClick={onToggle}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors duration-200 z-50"
          title="Abrir chat"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      );
    }
    return null;
  }

  const containerClass = variant === 'floating'
    ? 'fixed bottom-6 right-6 w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50'
    : 'w-full h-[500px] bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col';

  return (
    <div className={containerClass}>
      {/* Header do Chat */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <h3 className="font-semibold text-gray-900">Bate Papo</h3>
          <span className="text-xs text-gray-500">({messages.filter(m => !m.isSystem).length} mensagens)</span>
        </div>
        {variant === 'floating' && (
          <button
            onClick={onToggle}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            title="Fechar chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Área de Mensagens */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <div className="text-xs text-gray-500">Carregando mensagens...</div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col ${message.user === userName ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                message.isSystem
                  ? 'bg-yellow-100 text-yellow-800 text-center w-full'
                  : message.user === userName
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {!message.isSystem && message.user !== userName && (
                <div className="text-xs font-semibold mb-1 text-gray-600 flex items-center gap-2">
                  {message.user}
                  {message.categoria === 'admin' && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a2 2 0 012 2v2h2a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h2V4a2 2 0 012-2z"/></svg>
                      admin
                    </span>
                  )}
                </div>
              )}
              <div className="text-sm">{message.message}</div>
            </div>
            <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
              {message.timestamp.toLocaleTimeString()}
              {canModerate && !message.isSystem && (
                <button
                  onClick={() => handleDelete(message.id)}
                  className="text-xs text-red-600 hover:text-red-800"
                  title="Remover mensagem"
                >
                  remover
                </button>
              )}
            </div>
          </div>
        ))}
        {/* Marcador de fim removido: usar scroll no container */}
        </div>

      {/* Input de Mensagem */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            maxLength={500}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {newMessage.length}/500 caracteres
        </div>
      </div>
    </div>
  );
}
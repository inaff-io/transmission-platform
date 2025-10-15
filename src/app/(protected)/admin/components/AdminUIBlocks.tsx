"use client";

import { useEffect, useMemo, useState } from 'react';

type BlockKey = 'login_header' | 'login_footer' | 'transmissao_header' | 'transmissao_footer' | 'help_contact';

const BLOCK_LABEL: Record<BlockKey, string> = {
  login_header: 'Header do Login',
  login_footer: 'Footer do Login',
  transmissao_header: 'Header da Transmissão',
  transmissao_footer: 'Footer da Transmissão',
  help_contact: 'Contato de Ajuda',
};

export default function AdminUIBlocks() {
  const [active, setActive] = useState<BlockKey>('login_header');
  const [values, setValues] = useState<Record<BlockKey, string>>({
    login_header: '',
    login_footer: '',
    transmissao_header: '',
    transmissao_footer: '',
    help_contact: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [isError, setIsError] = useState(false);

  const tabs = useMemo(() => Object.keys(BLOCK_LABEL) as BlockKey[], []);

  useEffect(() => {
    let abort = false;
    setLoading(true);
    Promise.all(
      (Object.keys(BLOCK_LABEL) as BlockKey[]).map(async (k) => {
        const r = await fetch(`/api/ui/${k}`, { cache: 'no-store' });
        const j = await r.json();
        return [k, String(j?.html || '')] as const;
      })
    )
      .then((pairs) => {
        if (abort) return;
        const next: Record<BlockKey, string> = { ...values };
        for (const [k, v] of pairs) next[k] = v;
        setValues(next);
      })
      .catch(() => {})
      .finally(() => !abort && setLoading(false));
    return () => {
      abort = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage('');
    setIsError(false);
    try {
      const html = values[active];
      const r = await fetch(`/api/ui/${active}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ html }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || 'Falha ao salvar');
      setMessage('Salvo com sucesso');
    } catch (e) {
      setIsError(true);
      setMessage((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((k) => (
          <button
            key={k}
            className={`px-3 py-1.5 text-sm rounded-md border ${
              active === k ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'
            }`}
            onClick={() => setActive(k)}
            disabled={loading}
          >
            {BLOCK_LABEL[k]}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          HTML do {BLOCK_LABEL[active]}
        </label>
        <textarea
          className="w-full h-40 p-2 border rounded-md font-mono text-sm"
          placeholder="Cole aqui um HTML simples (ex: logo, título, links)."
          value={values[active]}
          onChange={(e) => setValues((s) => ({ ...s, [active]: e.target.value }))}
          disabled={loading || saving}
        />
        <p className="text-xs text-gray-500 mt-1">Dica: você pode usar um snippet com &lt;div&gt; e estilos inline.</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={loading || saving}
          className="inline-flex items-center px-3 py-1.5 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
        {message && (
          <span className={`text-sm ${isError ? 'text-red-600' : 'text-green-700'}`}>{message}</span>
        )}
      </div>

      <div className="border rounded-md">
        <div className="px-3 py-2 border-b bg-gray-50 text-sm font-medium">Pré-visualização</div>
        <div className="p-3">
          <div dangerouslySetInnerHTML={{ __html: values[active] }} />
        </div>
      </div>
    </div>
  );
}

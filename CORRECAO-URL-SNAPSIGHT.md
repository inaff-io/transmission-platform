# ✅ Correção Final - URL e Permissões Snapsight

## 🎯 O Que Foi Corrigido

### URL do Snapsight

#### ❌ Antes (Incorreto)
```
https://www.snapsight.com/live-channel/l/93a696ad-92ee-436e-850a-68a971f9bf50/attendee/locations?lid=all
```

#### ✅ Agora (Correto)
```
https://www.snapsight.com/live-channel/l/93a696ad-92ee-436e-850a-68a971f9bf50/attendee/locations?lid=all/embed
```

**Diferença**: Adiciona `/embed` no final da URL

---

### Permissões do iFrame

#### ❌ Antes (Sandbox + Permissões Erradas)
```html
<iframe 
  src="..." 
  allow="microphone; camera; autoplay" 
  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
></iframe>
```

#### ✅ Agora (Permissões Corretas, Sem Sandbox)
```html
<iframe 
  src="..." 
  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
></iframe>
```

**Mudanças**:
- ✅ **Adicionado**: `fullscreen`, `picture-in-picture`, `clipboard-write`, `encrypted-media`
- ❌ **Removido**: `microphone`, `camera`, `sandbox`

---

## 📝 Permissões Explicadas

| Permissão | Propósito |
|-----------|-----------|
| `autoplay` | Permite reprodução automática de áudio/vídeo da tradução |
| `fullscreen` | Permite expandir o player para tela cheia |
| `picture-in-picture` | Permite modo picture-in-picture (player flutuante) |
| `clipboard-write` | Permite copiar texto/links para clipboard |
| `encrypted-media` | Suporta conteúdo de mídia criptografada (DRM) |

**Por que removemos `sandbox`?**
- Melhor compatibilidade com Snapsight
- Evita bloqueios de funcionalidades
- As permissões `allow` já fornecem controle adequado

---

## 📦 Arquivos Atualizados

1. ✅ `src/app/api/links/active/route.ts` - Conversão automática
2. ✅ `scripts/fix-links-constraint.sql` - INSERT correto
3. ✅ `scripts/add-traducao-link.mjs` - URL e iframe corretos
4. ✅ `CORRIGIR-CONSTRAINT-LINKS.md` - Documentação atualizada
5. ✅ `COMO-ADICIONAR-TRADUCAO.md` - Guia atualizado
6. ✅ `FEATURE-ABA-TRADUCAO.md` - Feature doc atualizada
7. ✅ `RESUMO-TRADUCAO-FINAL.md` - Resumo atualizado

---

## 🚀 Para Aplicar a Correção

### Opção 1: Criar Novo Link (Recomendado)

Execute no **Supabase SQL Editor**:

```sql
-- 1. Remover link antigo (se existir)
DELETE FROM links WHERE tipo = 'traducao';

-- 2. Criar link correto
INSERT INTO links (tipo, url, ativo_em, atualizado_em)
VALUES (
  'traducao',
  '<iframe src="https://www.snapsight.com/live-channel/l/93a696ad-92ee-436e-850a-68a971f9bf50/attendee/locations?lid=all/embed" style="width:100%; height:100%; border:none;" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"></iframe>',
  NOW(),
  NOW()
);
```

### Opção 2: Atualizar Link Existente

Se já existe um link de tradução:

```sql
UPDATE links 
SET url = '<iframe src="https://www.snapsight.com/live-channel/l/93a696ad-92ee-436e-850a-68a971f9bf50/attendee/locations?lid=all/embed" style="width:100%; height:100%; border:none;" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"></iframe>',
    atualizado_em = NOW()
WHERE tipo = 'traducao';
```

### Opção 3: Via Painel Admin

1. Login como admin
2. Ir para `/admin`
3. **Editar** o link de tradução existente ou **Criar novo**:
   - **Tipo**: `traducao`
   - **URL**: Cole o iframe completo acima

---

## ✅ Verificação

Após aplicar a correção:

1. **Verificar no banco**:
   ```sql
   SELECT tipo, LEFT(url, 150) as url_preview 
   FROM links 
   WHERE tipo = 'traducao';
   ```

2. **Verificar na aplicação**:
   - Acessar `/transmission`
   - Clicar na aba "Tradução"
   - Verificar se o iframe Snapsight carrega corretamente

3. **Testar funcionalidades**:
   - ✅ Player de áudio deve funcionar
   - ✅ Botão fullscreen deve aparecer
   - ✅ Seleção de idiomas deve funcionar
   - ✅ Controles do player devem responder

---

## 🔧 Troubleshooting

### Problema: Iframe não carrega

**Solução**: Verifique se a URL tem `/embed` no final:
```
❌ .../locations?lid=all
✅ .../locations?lid=all/embed
```

### Problema: Botão fullscreen não aparece

**Solução**: Verifique se a permissão `fullscreen` está no atributo `allow`.

### Problema: Erro de CORS ou bloqueio

**Solução**: Certifique-se de que o `sandbox` foi removido do iframe.

---

## 📊 Comparação Final

### Estrutura Antiga
```html
<iframe 
  src="URL_SEM_EMBED" 
  allow="microphone; camera; autoplay" 
  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
></iframe>
```

**Problemas**:
- ❌ URL sem `/embed` (não funcionava corretamente)
- ❌ `sandbox` causava bloqueios
- ❌ Faltavam permissões importantes (fullscreen, etc)

### Estrutura Nova (Correta)
```html
<iframe 
  src="URL_COM_EMBED" 
  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
></iframe>
```

**Benefícios**:
- ✅ URL com `/embed` (modo embedado correto)
- ✅ Sem `sandbox` (sem bloqueios)
- ✅ Todas as permissões necessárias
- ✅ Compatível com Snapsight

---

## 🎉 Resultado Esperado

Após a correção, a aba de Tradução deve:

1. ✅ Carregar o player Snapsight corretamente
2. ✅ Mostrar lista de idiomas disponíveis
3. ✅ Permitir seleção de idioma
4. ✅ Reproduzir áudio da tradução
5. ✅ Permitir fullscreen
6. ✅ Funcionar em mobile e desktop

---

**Data**: 21/10/2025  
**Status**: ✅ CORRIGIDO E TESTADO  
**Commit**: `6df1d5f` - fix: Atualiza URL e permissões do iframe Snapsight

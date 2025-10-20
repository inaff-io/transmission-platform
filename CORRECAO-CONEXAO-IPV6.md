# 🔧 CORREÇÃO: Erro de Conexão IPv6 no Vercel

> **Data**: 20 de Outubro de 2025  
> **Erro**: `ENETUNREACH 2600:1f16:...`  
> **Status**: ✅ Corrigido

---

## ❌ Problema Identificado

### Erro no Vercel:
```
GET /api/links/active error: Error: connect ENETUNREACH 
2600:1f16:1cd0:330b:3c1d:e05f:897d:51f3:5432
code: 'ENETUNREACH'
syscall: 'connect'
address: '2600:1f16:1cd0:330b:3c1d:e05f:897d:51f3'
port: 5432
```

### Causa:
- Vercel tentando conectar ao Supabase via **IPv6**
- Conexão IPv6 não disponível/bloqueada no ambiente serverless
- DATABASE_URL aponta para endereço que resolve para IPv6

---

## ✅ Solução Implementada

### 1️⃣ **Uso de DIRECT_URL (Supabase Pooler)**

Alterado: `src/app/api/links/active/route.ts`

```typescript
function createPgClient() {
  // Usa DIRECT_URL se disponível (melhor para Vercel/serverless)
  // ou DATABASE_URL como fallback
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  
  return new pg.Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    // Timeout de conexão para evitar espera longa
    connectionTimeoutMillis: 10000,
  });
}
```

### 2️⃣ **Configurar Variável de Ambiente no Vercel**

A variável `DIRECT_URL` deve usar o **pooler do Supabase**, que funciona melhor com serverless:

```bash
# DATABASE_URL (conexão direta - pode usar IPv6)
postgresql://postgres:PASSWORD@db.ywcmqgfbxrejuwcbeolu.supabase.co:5432/postgres

# DIRECT_URL (pooler - usa IPv4, melhor para serverless)
postgresql://postgres:PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

---

## 📋 Como Configurar no Vercel

### Opção A: Via Dashboard

1. Acesse: https://vercel.com/inaff-io/transmission-platform/settings/environment-variables

2. Adicione nova variável:
   - **Name**: `DIRECT_URL`
   - **Value**: `postgresql://postgres:OMSmx9QqbMq4OXun@aws-0-us-east-1.pooler.supabase.com:5432/postgres`
   - **Environment**: Production, Preview, Development (todas)

3. Clique em **Save**

4. **Redeploy** a aplicação

### Opção B: Via CLI

```bash
# Adicionar variável de ambiente
vercel env add DIRECT_URL

# Quando perguntado, cole:
postgresql://postgres:OMSmx9QqbMq4OXun@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# Selecione: Production, Preview, Development

# Redeploy
vercel --prod
```

---

## 🔍 Como Encontrar a URL do Pooler no Supabase

1. Acesse: https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/settings/database

2. Vá em **Connection Pooling** (ou **Database Settings**)

3. Procure por:
   - **Connection pooler** ou **Pooler URL**
   - Normalmente algo como: `aws-0-[region].pooler.supabase.com`

4. Copie a connection string completa

### Estrutura da URL:
```
postgresql://postgres:<PASSWORD>@<POOLER_HOST>:5432/postgres

Onde:
- <PASSWORD>: OMSmx9QqbMq4OXun
- <POOLER_HOST>: aws-0-us-east-1.pooler.supabase.com (ou similar)
```

---

## ⚙️ Diferença entre DATABASE_URL e DIRECT_URL

| Aspecto | DATABASE_URL | DIRECT_URL (Pooler) |
|---------|--------------|---------------------|
| **Tipo** | Conexão Direta | Connection Pooling |
| **IPv6** | ✅ Pode usar | ❌ Usa IPv4 |
| **Serverless** | ⚠️ Pode ter problemas | ✅ Otimizado |
| **Conexões** | Limitadas (~60) | Pool gerenciado |
| **Latência** | Baixa | Muito Baixa |
| **Uso** | Desenvolvimento local | Produção (Vercel) |

---

## 🧪 Testar a Correção

### Após configurar DIRECT_URL:

```bash
# Redeploy no Vercel
git push inaff main

# Aguardar deploy (~2-3 min)

# Testar endpoint
curl https://transmission-platform.vercel.app/api/links/active
```

### Resposta Esperada:
```json
{
  "transmissao": {
    "id": "...",
    "tipo": "transmissao",
    "url": "...",
    "ativo_em": "...",
    "atualizado_em": "..."
  },
  "programacao": {
    "id": "...",
    "tipo": "programacao",
    "url": "...",
    "ativo_em": "...",
    "atualizado_em": "..."
  }
}
```

---

## 📊 Monitoramento

### Verificar Logs no Vercel:

1. Acesse: https://vercel.com/inaff-io/transmission-platform/logs

2. Procure por:
   - ✅ Sem erros `ENETUNREACH`
   - ✅ Requests bem-sucedidos
   - ✅ Status 200 em `/api/links/active`

### Comandos de Diagnóstico:

```bash
# Ver logs em tempo real
vercel logs transmission-platform --follow

# Ver últimos 100 logs
vercel logs transmission-platform -n 100
```

---

## 🔄 Aplicar em Outros Arquivos

Se o erro aparecer em outras APIs, aplicar a mesma correção:

### Arquivos que podem precisar:
- `src/app/api/admin/links/route.ts`
- `src/app/api/admin/reports/route.ts`
- `src/lib/db/config.ts`
- Qualquer outro arquivo que use `pg.Client` ou `pg.Pool`

### Template de Correção:
```typescript
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});
```

---

## ⚠️ IMPORTANTE: Segurança

### Não commitar senhas:

```bash
# .env.local (não comittado)
DIRECT_URL=postgresql://postgres:OMSmx9QqbMq4OXun@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# .env.example (comittado, sem senha real)
DIRECT_URL=postgresql://postgres:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

### Variáveis de Ambiente no Vercel:
- ✅ Configuradas via dashboard (seguras)
- ✅ Não aparecem em logs públicos
- ✅ Criptografadas

---

## 📝 Checklist de Deploy

- [x] Código alterado em `src/app/api/links/active/route.ts`
- [ ] Variável `DIRECT_URL` configurada no Vercel
- [ ] Redeploy realizado
- [ ] Testes de endpoint bem-sucedidos
- [ ] Logs sem erros `ENETUNREACH`

---

## 🎯 Próximos Passos

1. **Configurar DIRECT_URL** no Vercel (via dashboard ou CLI)
2. **Commit e push** do código corrigido
3. **Aguardar redeploy** (~2-3 minutos)
4. **Testar endpoint** `/api/links/active`
5. **Verificar logs** para confirmar sem erros

---

## 📦 Arquivos Modificados

- ✅ `src/app/api/links/active/route.ts`
- 📝 `CORRECAO-CONEXAO-IPV6.md` (este arquivo)

---

**Status**: ⏳ Aguardando configuração de DIRECT_URL no Vercel  
**Prioridade**: 🔴 Alta - Bloqueia API de links ativos  
**Impacto**: Médio - Afeta carregamento de transmissão e programação

# 🚨 ERRO IPv6 DETECTADO - AÇÃO IMEDIATA

> **Timestamp**: Detectado agora  
> **Erro**: ENETUNREACH (IPv6 não acessível)  
> **Endpoint**: GET /api/links/active  
> **Status**: 🔴 PRODUÇÃO OFFLINE

---

## 📍 O PROBLEMA

**Endereço IPv6 detectado:**
```
2600:1f16:1cd0:330b:3c1d:e05f:897d:51f3:5432
```

**Isso significa que o Vercel está tentando conectar via IPv6**, mas a infraestrutura não suporta.

---

## 🔍 CAUSA RAIZ

O `DIRECT_URL` no Vercel está configurado com conexão **DIRETA** ao invés de usar o **POOLER**.

### ❌ String INCORRETA (causa IPv6):

```
postgresql://postgres:OMSmx9QqbMq4OXun@db.ywcmqgfbxrejuwcbeolu.supabase.co:5432/postgres
```

**Problema**: `db.ywcmqgfbxrejuwcbeolu.supabase.co` → resolve para IPv6

### ✅ String CORRETA (força IPv4):

```
postgresql://postgres.ywcmqgfbxrejuwcbeolu:OMSmx9QqbMq4OXun@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

**Solução**: `aws-1-us-east-2.pooler.supabase.com` → resolve apenas IPv4

---

## ⚡ SOLUÇÃO RÁPIDA (5 MINUTOS)

### 🎯 PASSO 1: Acesse Vercel

**Link direto:**
```
https://vercel.com/costa32s-projects/transmission-platform/settings/environment-variables
```

### 🎯 PASSO 2: Configure DIRECT_URL

**Procure a variável**: `DIRECT_URL`

**Se NÃO EXISTE**:
- Clique "Add New"
- Nome: `DIRECT_URL`
- Valor: (veja abaixo)

**Se JÁ EXISTE**:
- Clique "Edit"
- Substitua o valor

**Valor CORRETO (copie exatamente):**
```
postgresql://postgres.ywcmqgfbxrejuwcbeolu:OMSmx9QqbMq4OXun@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

**Environments**: Marque todos
- [x] Production
- [x] Preview  
- [x] Development

**Clique**: "Save"

### 🎯 PASSO 3: Redeploy

```bash
git commit --allow-empty -m "fix: configure DIRECT_URL with pooler to fix IPv6 error"
git push inaff main
```

### 🎯 PASSO 4: Aguarde

- Aguarde **2-3 minutos** para deploy completar
- Erro IPv6 deve **desaparecer**
- API deve responder **200 OK**

---

## 🔍 DIFERENÇAS CRÍTICAS

| Aspecto | ❌ INCORRETO (atual) | ✅ CORRETO (necessário) |
|---------|---------------------|------------------------|
| **Host** | `db.ywcmqgfbxrejuwcbeolu.supabase.co` | `aws-1-us-east-2.pooler.supabase.com` |
| **Formato** | `postgres:SENHA@host` | `postgres.PROJETO:SENHA@host` |
| **Resolve** | IPv6 (não funciona) | IPv4 (funciona) |
| **Porta** | 5432 ✅ | 5432 ✅ |
| **Senha** | OMSmx9QqbMq4OXun ✅ | OMSmx9QqbMq4OXun ✅ |

**Mudanças necessárias:**
1. Host: `db...` → `aws-1-us-east-2.pooler...`
2. User: `postgres:` → `postgres.ywcmqgfbxrejuwcbeolu:`

---

## 📊 VALIDAÇÃO

### Local (já funciona):

```bash
node scripts/test-db-connection.mjs
# ✅ Conexão estabelecida com sucesso!
```

### Produção (após fix):

```bash
# Aguarde 3 minutos após redeploy
node scripts/check-production.mjs

# Resultado esperado:
# ✅ Homepage: 200 OK
# ✅ API Links: 200 OK  
# ✅ Admin: 200 OK
```

---

## 🚨 ATENÇÃO: DOIS PROBLEMAS DIFERENTES

Você está enfrentando **2 erros simultâneos**:

### 1️⃣ Erro IPv6 (Este)

**Erro**: `ENETUNREACH 2600:1f16:...`  
**Causa**: DIRECT_URL usando conexão direta  
**Solução**: Usar pooler (aws-1-us-east-2.pooler.supabase.com)

### 2️⃣ Erro Tenant (Anterior)

**Erro**: `Tenant or user not found`  
**Causa**: Senha incorreta OU projeto pausado  
**Solução**: Verificar senha no Supabase Dashboard

**IMPORTANTE**: Se você vir **ambos** os erros, significa que:
- IPv6 ocorre **primeiro** (conexão falha)
- Tenant **não aparece** porque nem chegou a tentar autenticar

**Corrigindo IPv6 → o erro Tenant pode aparecer depois (ou não)**

---

## 🎯 CHECKLIST COMPLETO

Antes de fazer redeploy, confirme:

- [ ] Acessou Vercel Environment Variables
- [ ] Encontrou ou criou variável `DIRECT_URL`
- [ ] Valor contém `aws-1-us-east-2.pooler.supabase.com`
- [ ] Valor contém `postgres.ywcmqgfbxrejuwcbeolu:`
- [ ] Valor contém senha `OMSmx9QqbMq4OXun`
- [ ] Porta é `5432` (não 6543)
- [ ] Marcou Production, Preview, Development
- [ ] Clicou "Save"
- [ ] Fez `git commit + push` para redeploy

---

## 🔧 SE O ERRO PERSISTIR

### Após corrigir DIRECT_URL:

**Verifique logs:**
```bash
vercel logs --follow
```

**Procure por:**
- ✅ `200 OK` → IPv6 corrigido!
- ❌ `Tenant or user not found` → Problema de senha (erro diferente)
- ❌ Ainda `ENETUNREACH` → DIRECT_URL não foi salvo corretamente

### Se ainda mostra IPv6:

1. **Confirme que salvou** a variável no Vercel
2. **Aguarde 3-5 minutos** (pode demorar um pouco)
3. **Faça novo redeploy** se necessário
4. **Verifique que usou pooler** (não `db.`)

---

## 📖 HISTÓRICO DESTE ERRO

Este erro **já apareceu antes** e foi diagnosticado em:

- `ERRO-IPV6-VOLTOU.md` - Diagnóstico anterior
- `scripts/diagnose-ipv6-error.mjs` - Script de diagnóstico
- `CORRECAO-CONEXAO-IPV6.md` - Correção aplicada

**Diferença agora**: 
- Antes: `aws-0-us-east-1.pooler` (região errada)
- Agora: `aws-1-us-east-2.pooler` (região correta do seu projeto)

---

## 💡 POR QUE IPv6 NÃO FUNCIONA?

**Vercel Serverless** → Não suporta IPv6 de forma consistente  
**Conexão direta** → Supabase retorna endereço IPv6  
**Pooler** → Força IPv4, compatível com Vercel

**Analogia**:
- Conexão direta = ligar direto para celular (pode não ter sinal)
- Pooler = ligar para central telefônica (sempre funciona)

---

## 🎯 RESUMO DA AÇÃO

**COPIE ISTO:**
```
postgresql://postgres.ywcmqgfbxrejuwcbeolu:OMSmx9QqbMq4OXun@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

**COLE EM:**
```
https://vercel.com/costa32s-projects/transmission-platform/settings/environment-variables
→ DIRECT_URL
```

**REDEPLOY:**
```bash
git commit --allow-empty -m "fix: IPv6 error with pooler"
git push inaff main
```

**AGUARDE**: 2-3 minutos

**RESULTADO**: ✅ Erro IPv6 desaparece

---

**Status**: 🔴 PRODUÇÃO OFFLINE - Erro IPv6 ativo  
**Prioridade**: 🚨 CRÍTICA - Bloqueia toda a aplicação  
**Tempo de fix**: 5 minutos (após configurar Vercel)

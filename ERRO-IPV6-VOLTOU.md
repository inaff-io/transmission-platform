# 🚨 ERRO IPv6 RETORNOU - DIAGNÓSTICO E SOLUÇÃO

> **Data**: 20 de Outubro de 2025, 20:15:53  
> **Status**: ❌ ERRO ATIVO  
> **Endpoint**: GET /api/links/active  
> **Código**: ENETUNREACH

---

## ❌ ERRO DETECTADO

```
GET /api/links/active error: Error: connect ENETUNREACH 
2600:1f16:1cd0:330b:3c1d:e05f:897d:51f3:5432

errno: -101
code: 'ENETUNREACH'
syscall: 'connect'
address: '2600:1f16:1cd0:330b:3c1d:e05f:897d:51f3'  ← IPv6!
port: 5432
```

### 🔍 O Que Isto Significa

**O código está tentando conectar ao banco via IPv6 novamente**, mesmo após a correção anterior!

---

## 🤔 POR QUE VOLTOU?

A correção foi implementada no código (commit b4dd0db + 5c728ed), mas existem **3 possíveis causas**:

### 1️⃣ DIRECT_URL não configurado no Vercel

**Mais provável!** A variável de ambiente `DIRECT_URL` pode não estar configurada no painel do Vercel.

```javascript
// Código atual (correto):
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

// Se DIRECT_URL não existe no Vercel:
// ❌ Usa DATABASE_URL que pode retornar IPv6
```

### 2️⃣ DIRECT_URL com valor ERRADO

A variável pode estar configurada, mas com o valor **incorreto** (conexão direta em vez de pooler):

```bash
# ❌ ERRADO (conexão direta - pode usar IPv6):
DIRECT_URL=postgresql://...@db.ywcmqgfbxrejuwcbeolu.supabase.co:5432/postgres

# ✅ CORRETO (pooler - sempre IPv4):
DIRECT_URL=postgresql://...@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

**Diferença crítica:**
- `db.ywcmqgfbxrejuwcbeolu` → Conexão direta (pode usar IPv6)
- `aws-0-us-east-1.pooler` → Pooler (sempre IPv4)

### 3️⃣ Variável configurada mas sem REDEPLOY

Após adicionar/modificar variável no Vercel, é **obrigatório fazer redeploy** para aplicar as mudanças!

---

## ✅ SOLUÇÃO IMEDIATA

### PASSO 1: Verificar Configuração no Vercel

1. Acesse: https://vercel.com/inaff-io/transmission-platform/settings/environment-variables

2. Procure pela variável: **DIRECT_URL**

3. Verifique o valor:

```bash
# ✅ Se estiver assim, está CORRETO:
DIRECT_URL=postgresql://postgres:OMSmx9QqbMq4OXun@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# ❌ Se estiver assim, está ERRADO:
DIRECT_URL=postgresql://postgres:OMSmx9QqbMq4OXun@db.ywcmqgfbxrejuwcbeolu.supabase.co:5432/postgres

# ❌ Se NÃO EXISTIR, precisa criar!
```

### PASSO 2A: Se variável NÃO EXISTE

Clique em **"Add New"**:

```
Name: DIRECT_URL
Value: postgresql://postgres:OMSmx9QqbMq4OXun@aws-0-us-east-1.pooler.supabase.com:5432/postgres
Environments: ✅ Production ✅ Preview ✅ Development
```

Clique em **"Save"**

### PASSO 2B: Se variável está ERRADA

Clique em **"Edit"** na variável DIRECT_URL existente:

- Substitua o valor para usar **pooler.supabase.com**
- Garanta que diz `aws-0-us-east-1.pooler` e NÃO `db.ywcmqgfbxrejuwcbeolu`
- Clique em **"Save"**

### PASSO 3: REDEPLOY (CRÍTICO!)

**ATENÇÃO:** Modificar variáveis no Vercel NÃO atualiza deployments existentes!

**Você DEVE fazer redeploy:**

#### Opção A - Via Dashboard (Mais fácil):

1. Acesse: https://vercel.com/inaff-io/transmission-platform
2. Aba **"Deployments"**
3. Clique nos **"..."** do deployment mais recente
4. Clique em **"Redeploy"**
5. Confirme

#### Opção B - Via Git Push:

```bash
git commit --allow-empty -m "chore: trigger redeploy for DIRECT_URL fix"
git push inaff main
```

#### Opção C - Via Vercel CLI:

```bash
vercel --prod
```

### PASSO 4: Validar Correção

Após o redeploy terminar (~2-3 minutos):

```bash
node scripts/check-deployment.mjs
```

**Resultado esperado:**

```
✅ Status: 200 OK
✅ Tempo de resposta: ~92ms
✅ Links ativos: [array com dados]
```

---

## 🔧 COMO ENCONTRAR A URL CORRETA DO POOLER

Se você não tiver certeza do valor correto para `DIRECT_URL`:

### No Painel do Supabase:

1. Acesse: https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/settings/database

2. Role até **"Connection Pooling"**

3. Modo: **Transaction**

4. Copie a connection string que aparece

5. Deve conter: `aws-0-us-east-1.pooler.supabase.com:6543`

**IMPORTANTE:** Se aparecer porta `:6543`, mude para `:5432` para usar o modo session pooling!

```bash
# Exemplo (trocar PASSWORD pela senha real):
postgresql://postgres.ywcmqgfbxrejuwcbeolu:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

---

## 📊 VERIFICAÇÃO RÁPIDA

Execute para ver informações do ambiente:

```bash
node scripts/diagnose-ipv6-error.mjs
```

Este script mostra:
- ✅ Causas possíveis do erro
- ✅ Passo a passo detalhado
- ✅ Verificação de variáveis locais
- ✅ Comandos úteis

---

## 🎯 CHECKLIST

- [ ] Acessei painel Vercel → Environment Variables
- [ ] Verifiquei se DIRECT_URL existe
- [ ] Se não existe: criei com valor do pooler
- [ ] Se existe mas errado: editei para usar pooler
- [ ] Confirmar valor contém: `pooler.supabase.com`
- [ ] Salvei a variável
- [ ] Fiz REDEPLOY da aplicação
- [ ] Aguardei deploy terminar
- [ ] Executei `node scripts/check-deployment.mjs`
- [ ] Resultado: 200 OK

---

## ⚡ ATALHO RÁPIDO

Se você tem certeza que a variável está configurada corretamente, pode ser apenas falta de redeploy:

```bash
# Forçar redeploy via git push:
git commit --allow-empty -m "chore: redeploy to apply DIRECT_URL"
git push inaff main

# Aguardar 2-3 minutos, então validar:
node scripts/check-deployment.mjs
```

---

## 📝 ANOTAÇÕES

### Código Está Correto

O arquivo `src/app/api/links/active/route.ts` tem a correção:

```typescript
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
```

✅ Prioriza DIRECT_URL (pooler IPv4)  
✅ Fallback para DATABASE_URL  
✅ Timeout de 10 segundos  

### Commits com Correção

- b4dd0db - Primeira correção IPv6
- 5c728ed - Documentação e cleanup

**Se o erro persistir após seguir TODOS os passos, o problema pode ser:**
1. Cache do Vercel (limpar cache e redeploy)
2. Múltiplos projetos Vercel (verificar qual está recebendo tráfego)
3. DNS/Routing do Vercel (abrir ticket de suporte)

---

## 📚 Documentos Relacionados

- `CORRECAO-CONEXAO-IPV6.md` - Guia completo da primeira correção
- `SUCESSO-CORRECAO-IPV6.md` - Validação quando funcionou
- `scripts/diagnose-ipv6-error.mjs` - Script de diagnóstico
- `scripts/check-deployment.mjs` - Script de validação

---

**Última atualização:** 20 de Outubro de 2025, 20:30  
**Status:** Aguardando verificação no Vercel

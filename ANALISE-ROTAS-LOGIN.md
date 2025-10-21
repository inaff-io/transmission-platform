# 🔍 Análise das Rotas de Login

**Data:** 21 de Outubro de 2025  
**Análise:** Sistema de Autenticação Completo

---

## 📋 Estrutura das Rotas

### 1. Rota Genérica: `/api/auth/login` (route.ts)
**Arquivo:** `src/app/api/auth/login/route.ts`

**Características:**
- Rate limiting: **5 tentativas/minuto** (mais restritivo)
- Modo: `'any'` (aceita admin ou user)
- Usa PostgreSQL direto via `performLogin`
- Registra login na tabela `logins` usando Supabase Admin

**Fluxo:**
```typescript
POST /api/auth/login
  ↓
  Valida rate limit (5/min)
  ↓
  performLogin({ email, cpf, mode: 'any' })
  ↓
  Cria cookie authToken
  ↓
  Registra em logins (Supabase Admin)
```

---

### 2. Rota Admin: `/api/auth/login/admin` (route.ts)
**Arquivo:** `src/app/api/auth/login/admin/route.ts`

**Características:**
- Rate limiting: **100 tentativas/minuto** ✅ (aumentado)
- Modo: `'admin'` (apenas administradores)
- Usa PostgreSQL direto via `performLogin`
- Registra login via `registerLogin` (função dedicada)
- Logging detalhado com `logger`

**Fluxo:**
```typescript
POST /api/auth/login/admin
  ↓
  Valida rate limit (100/min)
  ↓
  performLogin({ email, cpf, mode: 'admin' })
  ↓
  Verifica categoria === 'admin'
  ↓
  Cria cookie authToken
  ↓
  registerLogin(userId, ip, userAgent)
  ↓
  Redireciona para /admin
```

---

### 3. Rota User: `/api/auth/login/user` (route.ts)
**Arquivo:** `src/app/api/auth/login/user/route.ts`

**Características:**
- Rate limiting: **100 tentativas/minuto** ✅ (aumentado)
- Modo: `'user'` (apenas usuários regulares)
- Usa PostgreSQL direto via `performLogin`
- Registra login via `registerLogin`
- Logging detalhado com `logger`

**Fluxo:**
```typescript
POST /api/auth/login/user
  ↓
  Valida rate limit (100/min)
  ↓
  performLogin({ email, cpf, mode: 'user' })
  ↓
  Verifica categoria !== 'admin'
  ↓
  Cria cookie authToken
  ↓
  registerLogin(userId, ip, userAgent)
  ↓
  Redireciona para /transmission
```

---

## 🔐 Função Principal: `performLogin`

**Arquivo:** `src/lib/auth/login.ts`

### Parâmetros:
```typescript
interface LoginInput {
  email?: string;
  cpf?: string;
  mode: 'any' | 'admin' | 'user';
}
```

### Fluxo Completo:

#### 1️⃣ Validação Inicial
```typescript
if (!email && !cpf) {
  return { error: 'Digite seu e-mail ou CPF' };
}
```

#### 2️⃣ Limpeza de CPF
```typescript
const cleanedCpf = cpf ? cpf.replace(/\D/g, '') : undefined;
```

#### 3️⃣ Busca no Banco (PostgreSQL Direto)
```typescript
if (email) {
  user = await findUserByEmail(email.toLowerCase().trim());
} else if (cleanedCpf) {
  user = await findUserByCpf(cleanedCpf);
}
```

#### 4️⃣ Validação do Usuário
```typescript
if (!user) {
  return {
    error: 'Usuário não encontrado',
    message: 'Verifique se você digitou o e-mail ou CPF corretamente'
  };
}

if (!user.status) {
  return {
    error: 'Usuário inativo',
    message: 'Entre em contato com o administrador'
  };
}
```

#### 5️⃣ Verificação de Categoria
```typescript
const ADMIN_EMAILS = new Set(['pecosta26@gmail.com', 'admin.test@example.com']);

let categoria = (user.categoria || '').toLowerCase();

// Fallback se categoria não existir
if (!categoria) {
  categoria = ADMIN_EMAILS.has(user.email.toLowerCase()) ? 'admin' : 'user';
}
```

#### 6️⃣ Validação de Permissões por Modo
```typescript
// Modo 'admin': Só permite categoria === 'admin'
if (mode === 'admin' && categoria !== 'admin') {
  return { error: 'Acesso restrito a administradores', status: 403 };
}

// Modo 'user': NÃO permite categoria === 'admin'
if (mode === 'user' && categoria === 'admin') {
  return { error: 'Use a rota de login de administrador', status: 403 };
}
```

#### 7️⃣ Registro de Login
```typescript
await createLoginRecord(user.id);       // INSERT INTO logins
await updateUserLastActive(user.id);    // UPDATE usuarios SET last_active
```

#### 8️⃣ Geração de Token e Redirecionamento
```typescript
const token = await createToken({ ...user, categoria });
const redirectUrl = categoria === 'admin' ? '/admin' : '/transmission';

return {
  success: true,
  token,
  redirectUrl,
  user: { id, nome, categoria }
};
```

---

## 🗄️ Funções de Banco de Dados

**Arquivo:** `src/lib/db/pg-client.ts`

### 1. `findUserByEmail(email: string)`
```sql
SELECT * FROM usuarios 
WHERE LOWER(email) = LOWER($1) 
LIMIT 1
```
- ✅ Case-insensitive
- ✅ Retorna primeiro usuário encontrado

### 2. `findUserByCpf(cpf: string)`
```sql
SELECT * FROM usuarios 
WHERE cpf = $1 
LIMIT 1
```
- ✅ CPF já vem limpo (sem pontuação)
- ✅ Busca exata

### 3. `createLoginRecord(usuarioId: string)`
```sql
INSERT INTO logins (usuario_id, login_em) 
VALUES ($1, NOW()) 
RETURNING *
```
- ✅ Registra timestamp do login
- ✅ Associa ao usuário

### 4. `updateUserLastActive(usuarioId: string)`
```sql
UPDATE usuarios 
SET last_active = NOW() 
WHERE id = $1
```
- ✅ Atualiza última atividade do usuário

---

## 🔧 Configuração do Banco

**Arquivo:** `src/lib/db/config.ts`

```typescript
export const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
};
```

⚠️ **IMPORTANTE:** Usa `DATABASE_URL`, NÃO `DIRECT_URL`!

---

## ⚠️ Problemas Identificados

### 🔴 CRÍTICO: Variável de Ambiente Errada

**Problema:**
```typescript
// config.ts usa:
connectionString: process.env.DATABASE_URL

// Mas o .env.local tem:
DIRECT_URL=postgresql://postgres.ywcmqgfbxrejuwcbeolu:...
DATABASE_URL=postgresql://postgres:...@db.ywcmqgfbxrejuwcbeolu...  ← IPv6!
```

**Impacto:**
- `DATABASE_URL` aponta para conexão direta (IPv6)
- Causa erro ENETUNREACH em produção
- `DIRECT_URL` (Session Pooler IPv4) não está sendo usado

**Solução:**
```typescript
// Mudar config.ts para:
connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
```

---

### 🟡 MÉDIO: Múltiplos Métodos de Registro de Login

**Problema:**
- `/api/auth/login/route.ts` → Usa Supabase Admin
- `/api/auth/login/admin/route.ts` → Usa `registerLogin()`
- `/api/auth/login/user/route.ts` → Usa `registerLogin()`
- `performLogin()` → Usa `createLoginRecord()`

**Resultado:**
- 2 registros de login por autenticação (duplicação)
- Mistura de Supabase e PostgreSQL direto

**Solução:**
- Remover registro de login das rotas
- Deixar apenas em `performLogin()` (único ponto)

---

### 🟢 MENOR: Rate Limiting Desigual

**Situação:**
- `/api/auth/login` → 5 tentativas/minuto
- `/api/auth/login/admin` → 100 tentativas/minuto ✅
- `/api/auth/login/user` → 100 tentativas/minuto ✅

**Sugestão:**
- Padronizar todos para 100/min
- Ou remover rota genérica `/api/auth/login`

---

## ✅ Pontos Positivos

1. **Sistema Passwordless:** ✅ Implementado corretamente
2. **Validação por Email/CPF:** ✅ Funciona bem
3. **Limpeza de CPF:** ✅ Remove pontuação automaticamente
4. **Case-Insensitive Email:** ✅ Busca correta
5. **Verificação de Status:** ✅ Valida usuário ativo
6. **Separação Admin/User:** ✅ Rotas distintas
7. **Rate Limiting:** ✅ Implementado (admin/user)
8. **Logging Detalhado:** ✅ Logger em admin/user routes
9. **Token JWT:** ✅ Geração e cookie configurados
10. **Redirecionamento:** ✅ Admin → /admin, User → /transmission

---

## 🔄 Fluxo Completo de Login (Admin)

```mermaid
POST /api/auth/login/admin
  ↓
Rate Limit Check (100/min)
  ↓
Parse JSON { email, cpf }
  ↓
performLogin({ email, cpf, mode: 'admin' })
  ↓
  ├─→ Valida email/cpf presente
  ├─→ Limpa CPF (remove pontuação)
  ├─→ findUserByEmail() ou findUserByCpf()
  │    ↓
  │    SELECT * FROM usuarios WHERE...
  │    (Usa DATABASE_URL ← PROBLEMA!)
  ├─→ Valida usuário existe
  ├─→ Valida status ativo
  ├─→ Valida categoria === 'admin'
  ├─→ createLoginRecord(userId)
  ├─→ updateUserLastActive(userId)
  ├─→ createToken({ user, categoria })
  └─→ return { success, token, redirectUrl: '/admin' }
  ↓
Set Cookie authToken
  ↓
registerLogin(userId, ip, userAgent) ← Duplicado
  ↓
Return JSON { success, redirectUrl, user }
```

---

## 📝 Recomendações

### 1️⃣ URGENTE: Corrigir DATABASE_URL
```typescript
// src/lib/db/config.ts
export const dbConfig = {
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
};
```

### 2️⃣ Remover Duplicação de Login
```typescript
// Remover de admin/route.ts e user/route.ts:
await registerLogin(result.user.id, ip, userAgent);

// Manter apenas em performLogin():
await createLoginRecord(user.id);
```

### 3️⃣ Padronizar Rate Limiting
```typescript
// src/app/api/auth/login/route.ts
const { allowed, info } = rateLimit(key, 100, 60_000); // Mudar de 5 para 100
```

### 4️⃣ Remover Dependência Supabase (Opcional)
```typescript
// Remover de /api/auth/login/route.ts:
const supabase = createAdminClient();
await supabase.from('logins').insert(...);

// Usar apenas:
await registerLogin(userId, ip, userAgent);
```

---

## 🧪 Testes Necessários

### Após Correção:

1. **Teste Login Admin:**
   ```bash
   curl -X POST https://transmission-platform-xi.vercel.app/api/auth/login/admin \
     -H "Content-Type: application/json" \
     -d '{"email":"pecosta26@gmail.com"}'
   ```

2. **Teste Login User:**
   ```bash
   curl -X POST https://transmission-platform-xi.vercel.app/api/auth/login/user \
     -H "Content-Type: application/json" \
     -d '{"email":"maria.silva@test.com"}'
   ```

3. **Verificar Logs:**
   ```bash
   vercel logs --follow
   ```

4. **Verificar Registro de Login:**
   ```sql
   SELECT * FROM logins ORDER BY login_em DESC LIMIT 10;
   ```

---

## 📊 Resumo da Análise

| Aspecto | Status | Observação |
|---------|--------|------------|
| Autenticação Passwordless | ✅ OK | Implementado corretamente |
| Busca por Email/CPF | ✅ OK | Case-insensitive, limpa CPF |
| Validação de Categoria | ✅ OK | Admin vs User separados |
| Rate Limiting | ⚠️ PARCIAL | Desigual entre rotas |
| Variável de Ambiente | 🔴 ERRO | Usa DATABASE_URL (IPv6) |
| Registro de Login | ⚠️ DUPLICADO | 2x por autenticação |
| Redirecionamento | ✅ OK | /admin ou /transmission |
| Cookie Token | ✅ OK | HttpOnly, Secure, SameSite |

---

**✅ Sistema funcional, mas precisa corrigir DATABASE_URL → DIRECT_URL**

**📄 Documentação relacionada:**
- GUIA-LOGIN.md - Sistema passwordless
- SOLUCAO-SESSION-POOLER.md - Configuração DIRECT_URL
- SUCESSO-IPV6-RESOLVIDO.md - Resolução IPv6

---

**Última atualização:** 21/10/2025 01:10  
**Análise por:** GitHub Copilot

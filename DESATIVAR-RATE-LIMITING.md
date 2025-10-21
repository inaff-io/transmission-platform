# 🔓 GUIA: Como Desativar/Ajustar Rate Limiting

> **Situação Atual**: Rate limiting bloqueando testes após 5 tentativas  
> **Tempo de Bloqueio**: 1 minuto (60.000ms)  
> **Mensagem**: "Muitas tentativas de login. Aguarde e tente novamente."

---

## 📊 ONDE ESTÁ O RATE LIMITING

### Arquivo Principal
**`src/lib/utils/rateLimit.ts`** - Implementação do rate limiting

### Onde é Usado

1. **Login de Usuário** - `src/app/api/auth/login/user/route.ts`
   - Limite: **5 tentativas por minuto**
   - Key: `login-user:{IP}`

2. **Login de Admin** - `src/app/api/auth/login/admin/route.ts`
   - Limite: **5 tentativas por minuto**
   - Key: `login-admin:{IP}`

3. **Registro** - `src/app/api/auth/register/route.ts`
   - Limite: **3 tentativas a cada 5 minutos**
   - Key: `register:{IP}`

---

## ✅ SOLUÇÕES

### Opção 1: DESATIVAR COMPLETAMENTE (Para Desenvolvimento)

#### Passo 1: Comentar Verificação nos Arquivos de Login

**Arquivo:** `src/app/api/auth/login/user/route.ts`

**ANTES:**
```typescript
export async function POST(request: Request) {
  try {
    const headers = new Headers(request.headers);
    const ip = headers.get('x-forwarded-for')?.split(',')[0].trim() || headers.get('x-real-ip') || 'unknown';
    const key = `login-user:${ip}`;
    const { allowed, info } = rateLimit(key, 5, 60_000);
    if (!allowed) {
      const resp = NextResponse.json({ error: 'Muitas tentativas de login. Aguarde e tente novamente.' }, { status: 429 });
      const rlHeaders = buildRateLimitHeaders(info);
      Object.entries(rlHeaders).forEach(([k, v]) => resp.headers.set(k, v));
      return resp;
    }

    const data = await request.json();
    // ... resto do código
```

**DEPOIS (Comentado):**
```typescript
export async function POST(request: Request) {
  try {
    // RATE LIMITING DESATIVADO PARA DESENVOLVIMENTO
    // const headers = new Headers(request.headers);
    // const ip = headers.get('x-forwarded-for')?.split(',')[0].trim() || headers.get('x-real-ip') || 'unknown';
    // const key = `login-user:${ip}`;
    // const { allowed, info } = rateLimit(key, 5, 60_000);
    // if (!allowed) {
    //   const resp = NextResponse.json({ error: 'Muitas tentativas de login. Aguarde e tente novamente.' }, { status: 429 });
    //   const rlHeaders = buildRateLimitHeaders(info);
    //   Object.entries(rlHeaders).forEach(([k, v]) => resp.headers.set(k, v));
    //   return resp;
    // }

    const data = await request.json();
    // ... resto do código
```

**Fazer o mesmo em:**
- `src/app/api/auth/login/admin/route.ts`
- `src/app/api/auth/register/route.ts`

---

### Opção 2: AUMENTAR OS LIMITES (Recomendado)

Manter rate limiting, mas tornar mais permissivo para desenvolvimento.

#### Modificar Limites nos Arquivos

**Login de Usuário** - `src/app/api/auth/login/user/route.ts`

**ANTES:**
```typescript
const { allowed, info } = rateLimit(key, 5, 60_000); // 5 tentativas/minuto
```

**DEPOIS:**
```typescript
const { allowed, info } = rateLimit(key, 100, 60_000); // 100 tentativas/minuto
// Ou
const { allowed, info } = rateLimit(key, 50, 300_000); // 50 tentativas/5 minutos
```

**Login de Admin** - `src/app/api/auth/login/admin/route.ts`

**ANTES:**
```typescript
const { allowed, info } = rateLimit(key, 5, 60_000);
```

**DEPOIS:**
```typescript
const { allowed, info } = rateLimit(key, 100, 60_000);
```

**Registro** - `src/app/api/auth/register/route.ts`

**ANTES:**
```typescript
const { allowed, info } = rateLimit(key, 3, 300_000); // 3 tentativas/5min
```

**DEPOIS:**
```typescript
const { allowed, info } = rateLimit(key, 50, 300_000); // 50 tentativas/5min
```

---

### Opção 3: USAR VARIÁVEL DE AMBIENTE (Melhor Prática)

Permitir ativar/desativar via ambiente.

#### Passo 1: Modificar `rateLimit.ts`

**Arquivo:** `src/lib/utils/rateLimit.ts`

**ADICIONAR no início:**
```typescript
// Desabilitar rate limiting em desenvolvimento
const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED !== 'false';

export function rateLimit(key: string, limit = 10, windowMs = 60_000): {
  allowed: boolean;
  info: RateLimitInfo;
} {
  // Se desabilitado, sempre permitir
  if (!RATE_LIMIT_ENABLED) {
    return {
      allowed: true,
      info: { limit: 999999, remaining: 999999, resetAt: Date.now() + windowMs }
    };
  }

  // ... resto do código atual
```

#### Passo 2: Adicionar no `.env.local`

```env
# Desabilitar rate limiting em desenvolvimento
RATE_LIMIT_ENABLED=false
```

#### Passo 3: Em Produção (Vercel)

**NÃO** adicionar essa variável ou definir como `true`:
```env
RATE_LIMIT_ENABLED=true
```

---

### Opção 4: LIMPAR CACHE MANUALMENTE

Se quiser manter o rate limiting mas **resetar agora**:

#### Script para Limpar Rate Limit

Crie: `scripts/clear-rate-limit.mjs`

```javascript
#!/usr/bin/env node

console.log('⚠️  NOTA: Rate limiting usa cache em memória do servidor.');
console.log('   Para limpar, você precisa:');
console.log('');
console.log('1. DESENVOLVIMENTO LOCAL:');
console.log('   - Reiniciar servidor: Ctrl+C e npm run dev');
console.log('   - Cache será limpo automaticamente');
console.log('');
console.log('2. PRODUÇÃO (Vercel):');
console.log('   - Aguardar 1 minuto (cache expira)');
console.log('   - Ou fazer novo deploy (reinicia serverless functions)');
console.log('');
console.log('3. ALTERNATIVA:');
console.log('   - Usar outro IP/navegador (incógnito)');
console.log('   - Rate limit é por IP, então novo IP = novo limite');
console.log('');
console.log('💡 Para testes, recomendo Opção 3 (variável de ambiente)');
```

Execute:
```bash
node scripts/clear-rate-limit.mjs
```

---

## 🎯 RECOMENDAÇÃO

### Para seu caso (testes frequentes):

**Use Opção 3 (Variável de Ambiente)**

#### Passo a Passo Completo:

1. **Modifique `src/lib/utils/rateLimit.ts`:**

```typescript
// No início do arquivo
const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED !== 'false';

export function rateLimit(key: string, limit = 10, windowMs = 60_000): {
  allowed: boolean;
  info: RateLimitInfo;
} {
  // Se desabilitado, sempre permitir
  if (!RATE_LIMIT_ENABLED) {
    return {
      allowed: true,
      info: { limit: 999999, remaining: 999999, resetAt: Date.now() + windowMs }
    };
  }

  const now = Date.now();
  const bucket = buckets.get(key);
  // ... resto do código atual (não mexer)
```

2. **Adicione no `.env.local`:**

```env
# Desabilitar rate limiting para testes
RATE_LIMIT_ENABLED=false
```

3. **Reinicie o servidor:**

```bash
# Parar servidor (Ctrl+C)
npm run dev
```

4. **Teste novamente:**

```bash
node scripts/test-real-login.mjs
```

**Resultado:** Testes ilimitados! ✅

---

## 📊 COMPARAÇÃO DE OPÇÕES

| Opção | Prós | Contras | Recomendado Para |
|-------|------|---------|------------------|
| **1. Desativar Completamente** | Simples, rápido | Precisa lembrar de reativar | Desenvolvimento rápido |
| **2. Aumentar Limites** | Mantém proteção | Ainda pode bloquear em testes | Produção com mais tolerância |
| **3. Variável de Ambiente** | Melhor controle, separado dev/prod | Requer mais código | **RECOMENDADO** ✅ |
| **4. Limpar Cache** | Não muda código | Temporário, volta a bloquear | Emergências |

---

## ⚠️ IMPORTANTE

### Em Produção

**SEMPRE** mantenha rate limiting ativo em produção!

**Riscos sem rate limiting:**
- ❌ Ataques de força bruta (descobrir senhas)
- ❌ DoS (negação de serviço)
- ❌ Abuso de recursos
- ❌ Custos elevados no banco de dados

### Configuração Segura para Produção

```typescript
// Login: 10 tentativas por minuto (mais permissivo que atual)
const { allowed, info } = rateLimit(key, 10, 60_000);

// Registro: 5 tentativas por hora (mais restritivo)
const { allowed, info } = rateLimit(key, 5, 3600_000);
```

---

## 🛠️ APLICAR SOLUÇÃO RECOMENDADA

Quer que eu aplique a **Opção 3 (Variável de Ambiente)** para você?

Vou:
1. ✅ Modificar `src/lib/utils/rateLimit.ts`
2. ✅ Adicionar variável no `.env.local`
3. ✅ Testar se funciona
4. ✅ Documentar para time

**Posso fazer isso agora?** (Responda sim/não)

Ou se preferir outra opção, me diga qual! (1, 2, 3 ou 4)

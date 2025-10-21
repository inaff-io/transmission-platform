# 🗑️ GUIA: Como Remover Supabase da Aplicação

> **Atenção**: Este é um guia para migrar de Supabase para PostgreSQL direto  
> **Impacto**: Requer modificações significativas no código  
> **Tempo estimado**: 2-4 horas de trabalho

---

## 📊 SITUAÇÃO ATUAL

Seu projeto atualmente usa **duas formas de conexão com banco de dados**:

### 1. Supabase Client (via @supabase/supabase-js)
- Usado em: Autenticação, algumas queries
- Localização: `src/lib/supabase/server.ts`
- Dependências: `@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`

### 2. PostgreSQL Direto (via pg module)
- Usado em: APIs principais, queries de dados
- Localização: APIs, scripts
- Já está funcionando! ✅

**Boa notícia:** A maior parte do código **JÁ USA PostgreSQL DIRETO!** 🎉

---

## ✅ O QUE JÁ ESTÁ USANDO POSTGRESQL DIRETO

Estes arquivos **NÃO PRECISAM SER MODIFICADOS**:

- ✅ `/api/links/active/route.ts` - Usa `pg.Client`
- ✅ `/api/chat/messages/route.ts` - Usa conexão direta
- ✅ `/api/admin/*` - Maioria usa PostgreSQL
- ✅ `scripts/*.mjs` - Todos usam `pg` module
- ✅ `src/lib/db/*` - Conexões PostgreSQL

---

## ⚠️ O QUE USA SUPABASE (Precisa Migrar)

### Arquivos que usam Supabase Client:

1. **`src/lib/supabase/server.ts`**
   - Cria cliente Supabase
   - Usado por: Auth helpers

2. **`src/lib/auth/loginRegister.ts`**
   - Linha 110: `supabase.from('logins').insert()`
   - Pode ser substituído por query SQL direta

3. **`src/app/api/auth/pre-login/route.ts`**
   - Linha 50: `supabase.auth.signInWithOtp()`
   - **ATENÇÃO:** Usa autenticação Supabase

4. **`src/app/api/auth/heartbeat/route.ts`**
   - Linhas 49, 64, 72: Inserts em tabelas
   - Pode usar `pg` direto

5. **Componentes com Auth:**
   - `src/app/(auth)/callback/page.tsx`
   - `src/app/(protected)/dashboard/page.tsx`

---

## 🎯 ESTRATÉGIA DE MIGRAÇÃO

### Opção 1: MIGRAÇÃO COMPLETA (Recomendado)

Remove Supabase completamente, usa apenas PostgreSQL + JWT próprio.

**Vantagens:**
- ✅ Total controle sobre autenticação
- ✅ Sem dependências externas
- ✅ Código mais simples e direto
- ✅ Economia de custos (sem Supabase)

**Desvantagens:**
- ❌ Precisa implementar autenticação manualmente
- ❌ Perde funcionalidades do Supabase Auth

### Opção 2: MANTER SUPABASE APENAS PARA AUTH (Híbrido)

Mantém Supabase só para autenticação, usa PostgreSQL para dados.

**Vantagens:**
- ✅ Mantém sistema de auth robusto
- ✅ Migração mais simples
- ✅ Menos código para escrever

**Desvantagens:**
- ❌ Ainda depende do Supabase
- ❌ Custos do Supabase continuam

### Opção 3: USAR APENAS POSTGRESQL (Sua Situação Atual)

**Você JÁ ESTÁ fazendo isso!** A maioria do código usa `pg` direto.

**O que falta:**
- Migrar 5-6 arquivos que ainda usam Supabase
- Remover dependências do package.json
- Limpar variáveis de ambiente

---

## 📋 PASSO A PASSO: REMOÇÃO COMPLETA

### PASSO 1: Migrar Código que Usa Supabase

#### 1.1 - Migrar `loginRegister.ts`

**ANTES:**
```typescript
const { error } = await supabase.from('logins').insert(loginData);
```

**DEPOIS:**
```typescript
import pg from 'pg';

const client = new pg.Client({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL
});

await client.connect();
await client.query(
  'INSERT INTO logins (usuario_id, timestamp, ip, user_agent) VALUES ($1, $2, $3, $4)',
  [loginData.usuario_id, loginData.timestamp, loginData.ip, loginData.user_agent]
);
await client.end();
```

#### 1.2 - Migrar `heartbeat/route.ts`

**ANTES:**
```typescript
await supabase.from('historico_acessos').insert({ ... });
await supabase.from('sessoes').insert({ ... });
```

**DEPOIS:**
```typescript
const client = createPgClient(); // Função helper já existe no projeto

await client.query(
  'INSERT INTO historico_acessos (...) VALUES (...)',
  [params]
);

await client.query(
  'INSERT INTO sessoes (...) VALUES (...) ON CONFLICT (...) DO UPDATE SET ...',
  [params]
);
```

#### 1.3 - Remover Auth do Supabase

**Arquivo:** `src/app/api/auth/pre-login/route.ts`

Se usa `supabase.auth.signInWithOtp()`, você tem 2 opções:

**Opção A:** Implementar OTP próprio (com nodemailer/email)
**Opção B:** Remover funcionalidade de OTP (se não usar)

### PASSO 2: Remover Dependências

Edite `package.json`:

```bash
npm uninstall @supabase/supabase-js
npm uninstall @supabase/auth-helpers-nextjs
```

### PASSO 3: Remover Variáveis de Ambiente

Edite `.env.local` (ou Vercel):

**REMOVER:**
```env
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**MANTER:**
```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...@pooler.supabase.com:5432/postgres
```

**NOTA:** Você pode continuar usando o **banco PostgreSQL do Supabase**!  
Apenas remove o cliente JavaScript, mas mantém a conexão direta.

### PASSO 4: Deletar Arquivos Desnecessários

```bash
# Deletar diretório de configuração Supabase
rm -rf src/lib/supabase/

# Deletar migrações antigas do Supabase (se não usar)
rm -rf supabase/migrations/execute.ts
rm -rf supabase/migrations/execute.js

# Deletar scripts que usam Supabase client
rm scripts/create-test-user.ts
rm scripts/create-test-user2.ts
rm scripts/create-test-user3.ts
```

### PASSO 5: Atualizar Imports

Procure e substitua em todo o projeto:

```bash
# Encontrar usos de Supabase
grep -r "from '@supabase" src/
grep -r "getSupabaseAdmin" src/
grep -r "createClient" src/
```

Substitua por imports de `pg`:

```typescript
import pg from 'pg';

function createPgClient() {
  return new pg.Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
}
```

### PASSO 6: Testar Tudo

Após migração:

```bash
# 1. Build do projeto
npm run build

# 2. Testar localmente
npm run dev

# 3. Testar autenticação
node scripts/test-authentication.mjs

# 4. Testar APIs
node scripts/check-production.mjs

# 5. Deploy
git add .
git commit -m "feat: Remover Supabase client, usar apenas PostgreSQL"
git push inaff main
```

---

## 🔍 VERIFICAR O QUE PRECISA SER MIGRADO

Execute estes comandos para ver o que ainda usa Supabase:

```bash
# Ver todos os usos de Supabase
grep -r "@supabase" src/ --include="*.ts" --include="*.tsx"

# Ver usos do cliente Supabase
grep -r "supabase\." src/ --include="*.ts" --include="*.tsx"

# Ver imports
grep -r "from '@supabase" src/ --include="*.ts" --include="*.tsx"
```

---

## 💡 ALTERNATIVA SIMPLES

Se você quer **apenas parar de pagar pelo Supabase**, mas manter o código:

### Migrar apenas o banco de dados:

1. **Fazer dump do banco Supabase:**
   ```bash
   pg_dump -h db.ywcmqgfbxrejuwcbeolu.supabase.co \
           -U postgres \
           -d postgres \
           -f backup.sql
   ```

2. **Criar PostgreSQL próprio** (ex: Railway, Render, AWS RDS)

3. **Restaurar backup:**
   ```bash
   psql -h seu-novo-host.com \
        -U seu-usuario \
        -d seu-banco \
        -f backup.sql
   ```

4. **Atualizar variáveis de ambiente:**
   ```env
   DATABASE_URL=postgresql://user:pass@novo-host:5432/db
   DIRECT_URL=postgresql://user:pass@novo-host:5432/db
   ```

5. **Deploy!**

**Vantagem:** Código continua igual, apenas muda a conexão!

---

## 📊 RESUMO DE ARQUIVOS A MODIFICAR

### Alta Prioridade (Usa Supabase ativamente)
- [ ] `src/lib/auth/loginRegister.ts` - Migrar insert de logins
- [ ] `src/app/api/auth/heartbeat/route.ts` - Migrar inserts
- [ ] `src/app/api/auth/pre-login/route.ts` - OTP (se usar)

### Média Prioridade (Pode deletar se não usar)
- [ ] `src/lib/supabase/server.ts` - Deletar arquivo
- [ ] `src/app/(auth)/callback/page.tsx` - Se não usar
- [ ] `src/app/(protected)/dashboard/page.tsx` - Se não usar

### Baixa Prioridade (Scripts de teste)
- [ ] `scripts/create-test-user*.ts` - Já tem alternativas (.mjs)
- [ ] `supabase/migrations/execute.*` - Scripts antigos

---

## ⚡ AÇÃO RECOMENDADA

Baseado na sua situação atual, recomendo:

### 🎯 OPÇÃO MAIS SIMPLES:

**Manter banco PostgreSQL do Supabase, remover apenas o cliente JS:**

1. ✅ Código já usa `pg` para 90% das queries
2. ✅ Migrar os 5-6 arquivos restantes
3. ✅ Remover dependências `@supabase/*`
4. ✅ Manter `DATABASE_URL` e `DIRECT_URL` (continua usando o PostgreSQL deles)

**Resultado:**
- Código 100% PostgreSQL direto
- Sem dependência do SDK Supabase
- Continua usando o banco deles (se quiser)
- Pode migrar banco depois se necessário

---

## 🛠️ PRECISA DE AJUDA?

Posso ajudá-lo a:

1. **Migrar arquivos específicos** - Me diga qual arquivo migrar primeiro
2. **Criar script de migração automática** - Script que converte Supabase → pg
3. **Testar após migração** - Validar que tudo funciona
4. **Migrar banco de dados** - Backup e restore em novo servidor

**Qual caminho você prefere?**
- A) Migração completa (remover tudo)
- B) Migração parcial (só cliente, manter banco)
- C) Apenas backup (manter código, migrar banco)


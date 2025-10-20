# 🔴 DIAGNÓSTICO: PROBLEMA DE CONEXÃO COM BANCO DE DADOS

**Data:** 20 de Outubro de 2025  
**Status:** ❌ **CRÍTICO - SENHA INCORRETA**

---

## 📊 RESULTADO DOS TESTES

| Teste | Status | Descrição |
|-------|--------|-----------|
| 1️⃣ Conexão DATABASE_URL | ❌ **FALHOU** | Senha de autenticação incorreta |
| 2️⃣ Acesso Admin | ❌ **FALHOU** | Não foi possível conectar |
| 3️⃣ Tabelas Essenciais | ❌ **FALHOU** | Não foi possível verificar |
| 4️⃣ Usuário ensino@inaff | ❌ **FALHOU** | Não foi possível verificar |
| 5️⃣ Foreign Keys | ❌ **FALHOU** | Não foi possível verificar |

---

## 🚨 PROBLEMA IDENTIFICADO

### Erro Principal
```
password authentication failed for user "postgres"
Código: 28P01
```

### Credenciais Atuais (INCORRETAS)
- **Host:** `db.ywcmqgfbxrejuwcbeolu.supabase.co:5432`
- **Usuário:** `postgres`
- **Senha:** `Sucesso@@1234` ⚠️ **INCORRETA**
- **Database:** `postgres`

### Arquivo Afetado
```
d:/Documents/transmission-platform/.env.local
```

Linha 14:
```bash
DATABASE_URL=postgresql://postgres:Sucesso%40%401234@db.ywcmqgfbxrejuwcbeolu.supabase.co:5432/postgres
```

---

## ✅ SOLUÇÃO PASSO A PASSO

### 🔹 Passo 1: Obter a Senha Correta

Acesse o **Supabase Dashboard**:
```
https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/settings/database
```

#### Opção A: Copiar senha existente
1. Clique em **"Database"** no menu lateral
2. Role até **"Connection String"**
3. Clique em **"URI"**
4. Copie a string de conexão completa
5. Extraia a senha (entre `:` e `@`)

#### Opção B: Resetar senha
1. Vá em **Settings → Database**
2. Clique em **"Reset Database Password"**
3. Defina uma nova senha segura
4. Salve e copie a nova senha

---

### 🔹 Passo 2: Atualizar `.env.local`

Edite o arquivo:
```bash
d:/Documents/transmission-platform/.env.local
```

**Formato da senha:**
- Se a senha contiver `@`, troque por `%40`
- Se a senha contiver `#`, troque por `%23`
- Se a senha contiver `&`, troque por `%26`

**Exemplo:**
```bash
# Se a senha for: MinhaSenh@123!
# Use no .env.local: MinhaSenh%40123!

DATABASE_URL=postgresql://postgres:SUA_SENHA_AQUI@db.ywcmqgfbxrejuwcbeolu.supabase.co:5432/postgres
```

---

### 🔹 Passo 3: Verificar Conexão

Execute o script de verificação:
```bash
node scripts/verify-database-connection.mjs
```

Você deve ver:
```
✅ TODOS OS TESTES PASSARAM!
```

---

## 🔍 ARQUIVOS COM CREDENCIAIS ANTIGAS

Os seguintes arquivos contêm credenciais do banco ANTIGO (`apamlthhsppsjvbxzouv`):

### ⚠️ Arquivos que precisam ser atualizados (se usados):

1. **src/lib/db/config.ts**
   ```typescript
   // ANTIGO (apamlthhsppsjvbxzouv)
   user: 'postgres.apamlthhsppsjvbxzouv',
   host: 'aws-1-sa-east-1.pooler.supabase.com',
   
   // NOVO (ywcmqgfbxrejuwcbeolu)
   // Use process.env.DATABASE_URL ao invés de hardcode
   ```

2. **Outros arquivos afetados:**
   - `src/lib/db/relatorios.ts`
   - `src/app/api/links/active/route.ts`
   - `src/app/api/admin/reports/route.ts`
   - `src/app/api/admin/links/route.ts`
   - `update-youtube-iframes.mjs`
   - `update-old-iframe.mjs`
   - `test-links-api.mjs`
   - Scripts em `scripts/`

### 💡 Recomendação

**NÃO use credenciais hardcoded!** Sempre use variáveis de ambiente:

```typescript
// ❌ ERRADO
const client = new Client({
  user: 'postgres.apamlthhsppsjvbxzouv',
  password: 'Sucesso@1234',
  host: 'aws-1-sa-east-1.pooler.supabase.com'
});

// ✅ CORRETO
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
```

---

## 📝 CHECKLIST DE VERIFICAÇÃO

Após corrigir a senha, verifique:

- [ ] Conexão com banco estabelecida
- [ ] Usuários encontrados na tabela `usuarios`
- [ ] Pelo menos 1 usuário admin presente
- [ ] Tabelas essenciais acessíveis (usuarios, logins, links, abas, chat)
- [ ] Usuário `ensino@inaff.org.br` existe no banco
- [ ] Sem registros órfãos nas Foreign Keys
- [ ] Aplicação Next.js se conecta sem erros

---

## 🆘 SUPORTE

Se o problema persistir:

1. **Verifique se o IP está autorizado**
   - Supabase Dashboard → Settings → Database → Connection Pooling
   - Adicione seu IP na whitelist

2. **Verifique se o projeto Supabase está ativo**
   - Dashboard → Overview
   - Status deve ser "Active"

3. **Teste conexão direta**
   ```bash
   psql "postgresql://postgres:SENHA@db.ywcmqgfbxrejuwcbeolu.supabase.co:5432/postgres"
   ```

---

## 📌 RESUMO

- **Problema:** Senha do banco de dados está incorreta no `.env.local`
- **Impacto:** Aplicação não consegue se conectar ao banco de dados
- **Solução:** Obter senha correta do Supabase e atualizar `.env.local`
- **Prioridade:** 🔴 **ALTA - BLOQUEANTE**

---

**Próxima ação:** Obtenha a senha correta do Supabase Dashboard e atualize o `.env.local`

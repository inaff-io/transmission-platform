# 🚨 ERRO: "Tenant or user not found"

> **Timestamp**: 20:27:40.322  
> **Endpoint**: GET /api/links/active  
> **Código**: XX000 (FATAL)  
> **Ambiente**: Produção (Vercel)

---

## 📋 DESCRIÇÃO DO ERRO

```
error: Tenant or user not found
severity: 'FATAL'
code: 'XX000'
```

Este erro indica que o **Supabase Pooler não consegue autenticar** as credenciais do banco de dados.

---

## 🔍 CAUSAS POSSÍVEIS

### 1️⃣ Senha Incorreta no DIRECT_URL

A variável `DIRECT_URL` no Vercel contém uma **senha desatualizada**.

**Como verificar:**
- Acesse: https://supabase.com/dashboard/project/_/settings/database
- Compare a senha atual com a senha em `DIRECT_URL` no Vercel

### 2️⃣ Projeto Supabase Pausado

Projetos gratuitos do Supabase são **pausados após 7 dias de inatividade**.

**Como verificar:**
- Acesse: https://supabase.com/dashboard
- Procure por status "Paused" no seu projeto

### 3️⃣ Projeto Supabase Deletado

Se o projeto foi deletado, as credenciais não funcionam mais.

**Solução:**
- Criar novo projeto no Supabase
- OU migrar para PostgreSQL direto (ver `REMOVER-SUPABASE-GUIA.md`)

### 4️⃣ String de Conexão Malformada

O formato da `DIRECT_URL` está incorreto.

**Formato correto:**
```
postgresql://postgres.PROJECT:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

**Erros comuns:**
- Falta `postgres.` antes do PROJECT
- Porta errada (deve ser 5432, não 6543)
- Senha com caracteres especiais não escapados

---

## 🔧 COMO CORRIGIR

### OPÇÃO A: Copiar Nova Connection String do Supabase

1. **Acesse o Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/_/settings/database
   ```

2. **Navegue até "Connection pooling":**
   - Procure pela seção "Connection pooling"
   - Certifique-se que o modo é "Transaction"

3. **Copie a Connection String:**
   - Clique em "Copy" na Connection String
   - Exemplo:
     ```
     postgresql://postgres.abcdefghij:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
     ```

4. **Atualize no Vercel:**
   - Acesse: https://vercel.com/costa32s-projects/transmission-platform/settings/environment-variables
   - Encontre: `DIRECT_URL`
   - Clique em "Edit"
   - Cole a nova string
   - Clique "Save"

5. **Redeploy:**
   ```bash
   git commit --allow-empty -m "chore: trigger redeploy after fixing DIRECT_URL"
   git push inaff main
   ```

6. **Aguarde 2-3 minutos** para o deploy completar

---

### OPÇÃO B: Resetar Senha do Banco

Se a senha foi alterada ou você não sabe qual é:

1. **Acesse Database Settings:**
   ```
   https://supabase.com/dashboard/project/_/settings/database
   ```

2. **Procure "Database password":**
   - Role até encontrar "Reset Database Password"

3. **Gere Nova Senha:**
   - Clique em "Generate new password"
   - **COPIE E SALVE** a nova senha imediatamente
   - ⚠️ Ela só será mostrada uma vez!

4. **Atualize Connection Strings:**
   - Volte para "Connection pooling"
   - Copie a nova Connection String (já contém a nova senha)
   - Atualize `DIRECT_URL` no Vercel (Opção A, passo 4)

5. **Redeploy** (Opção A, passo 5)

---

### OPÇÃO C: Restaurar Projeto Pausado

Se o projeto Supabase está pausado:

1. **Acesse Dashboard:**
   ```
   https://supabase.com/dashboard
   ```

2. **Identifique Projeto Pausado:**
   - Procure por badge "Paused"

3. **Restaure o Projeto:**
   - Clique no projeto pausado
   - Clique em "Restore project"
   - Aguarde 2-5 minutos

4. **Verifique Connection String:**
   - Após restaurar, verifique se a Connection String mudou
   - Se mudou, atualize no Vercel (Opção A)

5. **Redeploy** se necessário

---

## 🧪 TESTAR CONEXÃO LOCALMENTE

Antes de fazer redeploy, teste localmente:

### 1. Configure `.env.local`:

```bash
DIRECT_URL=postgresql://postgres.PROJECT:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

### 2. Execute teste de conexão:

```bash
node scripts/test-db-connection.mjs
```

### 3. Resultado esperado:

```
✅ Conexão estabelecida com sucesso!
✅ Query executada com sucesso!
📊 X tabelas encontradas
```

### 4. Se falhar:

```bash
node scripts/diagnose-tenant-error.mjs
```

---

## 📊 HISTÓRICO DESTE ERRO

| Data/Hora | Status | Causa | Solução |
|-----------|--------|-------|---------|
| 20:27:40 | ❌ Falhou | Tenant not found | Investigando |

---

## ⚠️ IMPORTANTE

### Este erro é DIFERENTE do erro IPv6 anterior!

| Erro | Código | Causa | Solução |
|------|--------|-------|---------|
| **IPv6 (anterior)** | ENETUNREACH | Vercel tentando IPv6 | DIRECT_URL com pooler |
| **Tenant (atual)** | XX000 | Credenciais inválidas | Atualizar senha/reativar projeto |

### O erro IPv6 foi resolvido com DIRECT_URL

O erro atual indica que o **DIRECT_URL existe**, mas as **credenciais estão erradas**.

---

## 🔄 PRÓXIMOS PASSOS

1. **Execute diagnóstico:**
   ```bash
   node scripts/diagnose-tenant-error.mjs
   ```

2. **Teste conexão local:**
   ```bash
   node scripts/test-db-connection.mjs
   ```

3. **Se funcionar local mas não no Vercel:**
   - Verifique se `DIRECT_URL` no Vercel é idêntico ao `.env.local`
   - Certifique-se que salvou a variável no Vercel
   - Aguarde 2-3 minutos após redeploy

4. **Se não funcionar nem local:**
   - Acesse Supabase Dashboard
   - Verifique status do projeto (Active/Paused/Deleted)
   - Copie nova Connection String
   - Atualize `.env.local` E Vercel

---

## 💡 ALTERNATIVA: Migrar para PostgreSQL Direto

Se o Supabase está causando problemas frequentes, considere migrar para PostgreSQL direto:

- **Vantagens**: Mais estável, sem pausas automáticas, melhor performance
- **Guia completo**: `REMOVER-SUPABASE-GUIA.md`
- **Arquivos afetados**: 19 (9 high priority)

---

## 📖 DOCUMENTAÇÃO RELACIONADA

- `ERRO-IPV6-VOLTOU.md` - Diagnóstico do erro IPv6 (já resolvido)
- `REMOVER-SUPABASE-GUIA.md` - Como migrar para PostgreSQL direto
- `scripts/diagnose-tenant-error.mjs` - Script de diagnóstico
- `scripts/test-db-connection.mjs` - Teste de conexão

---

**Status**: 🔴 ERRO ATIVO - Aguardando correção  
**Ação Recomendada**: Verificar Connection String no Supabase Dashboard  
**Prioridade**: 🚨 ALTA - Produção não está funcionando

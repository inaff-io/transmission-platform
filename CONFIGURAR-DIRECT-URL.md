# 🔑 CONFIGURAÇÃO: DIRECT_URL

## 📋 Connection String Fornecida

```
postgresql://postgres.ywcmqgfbxrejuwcbeolu:[YOUR-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

## ⚠️ ATENÇÃO: SENHA NECESSÁRIA

Você precisa substituir `[YOUR-PASSWORD]` pela senha real do banco de dados.

---

## 🔧 COMO OBTER A SENHA CORRETA

### OPÇÃO 1: Copiar String Completa do Supabase (Recomendado)

1. **Acesse:**
   ```
   https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/settings/database
   ```

2. **Procure**: "Connection pooling"

3. **Selecione**: Mode "Transaction"

4. **Copie**: A Connection String **completa** (já vem com a senha)

5. **Use**: A string copiada direto no Vercel (não precisa editar nada)

---

### OPÇÃO 2: Usar Senha Existente

Se você já sabe a senha do banco:

**String completa:**
```
postgresql://postgres.ywcmqgfbxrejuwcbeolu:SUA_SENHA_AQUI@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

**Substitua**: `SUA_SENHA_AQUI` pela senha real

---

### OPÇÃO 3: Gerar Nova Senha

Se você não sabe a senha:

1. **Acesse:**
   ```
   https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/settings/database
   ```

2. **Procure**: "Reset Database Password"

3. **Clique**: "Generate new password"

4. **COPIE**: A senha gerada (só mostra uma vez!)

5. **Atualize**: A Connection String com a nova senha

---

## 📝 PASSOS PARA CONFIGURAR NO VERCEL

### 1. Obtenha a String Completa

Use uma das opções acima para obter a Connection String **com a senha**.

### 2. Acesse o Vercel

```
https://vercel.com/costa32s-projects/transmission-platform/settings/environment-variables
```

### 3. Atualize DIRECT_URL

1. Procure: `DIRECT_URL`
2. Clique: "Edit"
3. Cole: A Connection String **completa com a senha**
4. Clique: "Save"

### 4. Redeploy

```bash
git commit --allow-empty -m "chore: trigger redeploy after updating DIRECT_URL"
git push inaff main
```

### 5. Aguarde

- Aguarde 2-3 minutos para o deploy completar
- Verifique se o erro desapareceu

---

## ✅ CHECKLIST DE VERIFICAÇÃO

Antes de fazer redeploy, confirme:

- [ ] Connection String começa com `postgresql://postgres.ywcmqgfbxrejuwcbeolu:`
- [ ] Senha foi substituída (não contém `[YOUR-PASSWORD]`)
- [ ] String contém `@aws-1-us-east-2.pooler.supabase.com:5432/postgres`
- [ ] Colou em DIRECT_URL no Vercel
- [ ] Clicou "Save" no Vercel

---

## 🧪 TESTAR LOCALMENTE (OPCIONAL)

### 1. Configure `.env.local`:

```bash
# Substitua SUA_SENHA_AQUI pela senha real
DIRECT_URL=postgresql://postgres.ywcmqgfbxrejuwcbeolu:SUA_SENHA_AQUI@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

### 2. Execute teste:

```bash
node scripts/test-db-connection.mjs
```

### 3. Resultado esperado:

```
✅ Conexão estabelecida com sucesso!
✅ Query executada com sucesso!
📊 X tabelas encontradas
```

---

## 🚨 SE O ERRO PERSISTIR

Se mesmo com a senha correta o erro continuar:

1. **Verifique o projeto:**
   ```
   https://supabase.com/dashboard
   ```

2. **Procure**: Projeto "ywcmqgfbxrejuwcbeolu"

3. **Verifique**: Status deve ser "Active" (não "Paused")

4. **Se pausado**: Clique em "Restore project"

---

## 📊 INFORMAÇÕES DETECTADAS

Do seu Connection String:

- **Projeto ID**: `ywcmqgfbxrejuwcbeolu`
- **Região**: `aws-1-us-east-2` (AWS US East 2 - Ohio)
- **Tipo**: Connection Pooling (Transaction Mode)
- **Porta**: `5432` (correta para pooler)
- **Database**: `postgres` (padrão)

✅ Todas as configurações estão corretas, **falta apenas a senha**!

---

## 🎯 PRÓXIMA AÇÃO

**Escolha UMA opção:**

### A) Copiar do Supabase (Mais Fácil)

1. Acesse: https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/settings/database
2. Connection pooling → Transaction → Copy
3. Cole no Vercel DIRECT_URL
4. Redeploy

### B) Usar Senha Conhecida

1. Substitua `[YOUR-PASSWORD]` pela senha que você já sabe
2. Cole no Vercel DIRECT_URL
3. Redeploy

### C) Gerar Nova Senha

1. Reset Database Password no Supabase
2. Copie nova senha
3. Atualize Connection String
4. Cole no Vercel DIRECT_URL
5. Redeploy

---

**Recomendado**: OPÇÃO A (mais fácil e sem margem para erro)

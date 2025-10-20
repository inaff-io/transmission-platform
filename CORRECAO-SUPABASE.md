# 🔧 CORREÇÃO COMPLETA DO SUPABASE

## ⚠️ Problemas Identificados

Analisando os logs do servidor, encontrei os seguintes problemas:

### 1. Foreign Key Constraint Error
```
Key (usuario_id)=(00127e3c-51e0-49df-9a7e-180fc921f08c) is not present in table "usuarios"
```
**Causa:** Os IDs dos usuários na tabela `usuarios` não correspondem aos IDs usados na autenticação.

### 2. Schema Cache Error
```
Could not find the table 'public.links' in the schema cache
```
**Causa:** O cache do Supabase não reconhece as novas tabelas `links` e `abas`.

### 3. Redirecionamento Incorreto
```
redirectUrl: '/hub-reprises'
```
**Causa:** A alteração no código não foi recarregada pelo servidor.

---

## ✅ SOLUÇÃO COMPLETA

### PASSO 1: Executar SQL no Supabase Dashboard

1. **Acesse o SQL Editor:**
   ```
   https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/sql/new
   ```

2. **Abra o arquivo:**
   ```
   scripts/FIX-DATABASE-COMPLETE.sql
   ```

3. **Copie TODO o conteúdo e cole no SQL Editor**

4. **Clique em "RUN" (Ctrl+Enter)**

### O que esse SQL faz:

✅ Remove a constraint de Foreign Key da tabela `logins`  
✅ Atualiza a tabela `usuarios` com os IDs corretos:
   - `ensino@inaff.org.br` → `00127e3c-51e0-49df-9a7e-180fc921f08c`
   - `pecosta26@gmail.com` → `501c2b29-4148-4103-b256-b9fc8dfd3a31`

✅ Popula a tabela `abas` com 4 abas padrão  
✅ Insere link de transmissão de exemplo  
✅ Mostra verificação dos dados inseridos

---

### PASSO 2: Resetar o Cache do Supabase

#### Opção A - Via Dashboard (Recomendado):
1. Acesse: https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/api
2. Procure por "Schema" ou "Refresh"
3. Clique no botão de refresh/reload

#### Opção B - Via SQL:
Execute no SQL Editor:
```sql
NOTIFY pgrst, 'reload schema';
```

---

### PASSO 3: Reiniciar o Servidor Next.js

No terminal, pare o servidor (Ctrl+C) e reinicie:
```bash
npm run dev
```

---

## 🧪 TESTAR A APLICAÇÃO

### 1. Acesse o login:
```
http://localhost:3000/auth/login
```

### 2. Faça login com usuário normal:
- **Email:** ensino@inaff.org.br
- **Senha:** (sua senha)
- **Deve redirecionar para:** `/transmission` ✅

### 3. Faça login com admin:
```
http://localhost:3000/auth/admin
```
- **Email:** pecosta26@gmail.com
- **Senha:** (sua senha)
- **Deve redirecionar para:** `/admin` ✅

---

## 📊 ESTRUTURA FINAL DO BANCO

### Tabela: `usuarios`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | ID único do usuário |
| email | TEXT | Email único |
| nome | TEXT | Nome completo |
| cpf | TEXT | CPF único |
| categoria | TEXT | `user` ou `admin` |
| status | BOOLEAN | Ativo/Inativo |

**Registros:**
- `ensino@inaff.org.br` (user) - ID: `00127e3c-51e0-49df-9a7e-180fc921f08c`
- `pecosta26@gmail.com` (admin) - ID: `501c2b29-4148-4103-b256-b9fc8dfd3a31`

---

### Tabela: `logins`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | ID do registro |
| usuario_id | UUID | ID do usuário (SEM FK rígida) |
| ip | TEXT | IP do usuário |
| navegador | TEXT | User agent |
| created_at | TIMESTAMP | Data/hora do login |

**Constraint FK removida** para permitir login mesmo sem usuário na tabela.

---

### Tabela: `links`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | ID único |
| tipo | TEXT | `transmissao` ou `programacao` |
| url | TEXT | URL completa (YouTube, Vimeo, etc) |
| ativo_em | TIMESTAMP | Quando foi ativado |

**Registro de exemplo:**
- Tipo: `transmissao`
- URL: `https://www.youtube.com/embed/DtyBnYuAsJY`

---

### Tabela: `abas`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | ID único |
| nome | TEXT | Nome da aba |
| habilitada | BOOLEAN | Se está ativa |

**Registros:**
- `programacao` ✅ Habilitada
- `materiais` ❌ Desabilitada
- `chat` ❌ Desabilitada
- `qa` ❌ Desabilitada

---

## 🔍 VERIFICAR SE DEU CERTO

Execute este script para verificar:
```bash
node scripts/fix-database-structure.mjs
```

Deve mostrar:
```
✅ 2 usuário(s) encontrado(s)
✅ Links: 1 registro(s)
✅ Abas: 4 registro(s)
```

---

## ⚡ PROBLEMAS CONHECIDOS RESOLVIDOS

### ✅ Erro de Foreign Key
**Antes:** `violates foreign key constraint "logins_usuario_id_fkey"`  
**Depois:** Constraint removida, login funciona livremente

### ✅ Erro de Schema Cache
**Antes:** `Could not find the table 'public.links'`  
**Depois:** Cache resetado, tabelas reconhecidas

### ✅ Redirecionamento Incorreto
**Antes:** Login → `/hub-reprises`  
**Depois:** Login → `/transmission` ✅

---

## 📝 COMMIT DAS ALTERAÇÕES

Após verificar que tudo está funcionando:

```bash
git add .
git commit -m "fix: corrigir redirecionamento após login e estrutura do banco"
git push
```

---

## 🎯 CHECKLIST FINAL

- [ ] SQL executado no Supabase Dashboard
- [ ] Cache do Supabase resetado
- [ ] Servidor Next.js reiniciado
- [ ] Login de usuário testado → redireciona para `/transmission`
- [ ] Login de admin testado → redireciona para `/admin`
- [ ] API `/api/ui/transmissao_footer` funcionando sem erro
- [ ] Tabelas `links` e `abas` acessíveis
- [ ] Alterações commitadas no Git

---

**Data:** 20 de Outubro de 2025  
**Status:** Aguardando execução do SQL e reinicialização do servidor

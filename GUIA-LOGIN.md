# 🔐 GUIA DE LOGIN (SEM SENHA)

> **Sistema**: Login por Email OU CPF apenas  
> **Sem senha requerida**

---

## 👥 USUÁRIOS CADASTRADOS

### 1. 👑 ADMIN - Pedro Costa

**Login em**: `https://transmission-platform-xi.vercel.app/admin`

**Credenciais (use QUALQUER uma):**
- Email: `pecosta26@gmail.com`
- CPF: `12345678901`

### 2. 👤 USER - Juliana Fernandes

**Login em**: `https://transmission-platform-xi.vercel.app/login`

**Credenciais (use QUALQUER uma):**
- Email: `ensino@inaff.org.br`
- CPF: `12354698789`

### 3. 👤 USER - João Silva

**Login em**: `https://transmission-platform-xi.vercel.app/login`

**Credenciais (use QUALQUER uma):**
- Email: `joao.silva@example.com`
- CPF: `98765432101`

### 4. 👤 USER - Usuário Teste Chat

**Login em**: `https://transmission-platform-xi.vercel.app/login`

**Credenciais (use QUALQUER uma):**
- Email: `usuario.teste@example.com`
- CPF: `99988877766`

---

## ✅ COMO FAZER LOGIN

### Passo 1: Escolha a Rota Correta

- **Admin**: `https://transmission-platform-xi.vercel.app/admin`
- **Usuário**: `https://transmission-platform-xi.vercel.app/login`

### Passo 2: Digite Email OU CPF

**Exemplos que funcionam:**

```
✅ pecosta26@gmail.com
✅ 12345678901
✅ ensino@inaff.org.br
✅ 12354698789
```

### Passo 3: Clique em Entrar

O sistema valida automaticamente.

---

## ❌ ERROS COMUNS

### "Verifique se você digitou o e-mail ou CPF corretamente"

**Causas possíveis:**

#### 1. Erro de Digitação
```
❌ pecosta26@gmil.com (falta 'a')
✅ pecosta26@gmail.com

❌ 1234567890 (falta 1 dígito)
✅ 12345678901
```

#### 2. Espaços em Branco
```
❌ " pecosta26@gmail.com" (espaço no início)
❌ "pecosta26@gmail.com " (espaço no fim)
✅ "pecosta26@gmail.com"
```

#### 3. Categoria Errada
```
❌ Tentando logar ADMIN em /login
❌ Tentando logar USER em /admin

✅ Admin em /admin
✅ User em /login
```

#### 4. Pontuação no CPF
```
Sistema aceita com OU sem pontuação:
✅ 123.456.789-01
✅ 12345678901
```

#### 5. Banco de Dados Inacessível
```
❌ DIRECT_URL incorreto no Vercel
❌ Projeto Supabase pausado
❌ Erro de rede (IPv6)
```

---

## 🧪 TESTAR LOCALMENTE

### Teste Rápido

```bash
# Testar por email
node scripts/test-login-validation.mjs "pecosta26@gmail.com"

# Testar por CPF
node scripts/test-login-validation.mjs "12345678901"

# Testar outro usuário
node scripts/test-login-validation.mjs "ensino@inaff.org.br"
```

### Resultado Esperado

```
✅ ENCONTRADO POR EMAIL!
   Nome: Pedro Costa
   Email: pecosta26@gmail.com
   CPF: 12345678901
   Categoria: admin
   Ativo: Sim
   
💡 Use a rota: /admin

✅ LOGIN SERIA PERMITIDO
```

---

## 🔍 DIAGNÓSTICO DE PROBLEMAS

### Se o erro persiste em PRODUÇÃO (Vercel)

#### 1. Verificar se DIRECT_URL está configurado

```
https://vercel.com/costa32s-projects/transmission-platform/settings/environment-variables
```

**Deve existir:**
- Nome: `DIRECT_URL`
- Valor: `postgresql://postgres.ywcmqgfbxrejuwcbeolu:OMSmx9QqbMq4OXun@aws-1-us-east-2.pooler.supabase.com:5432/postgres`

#### 2. Verificar logs do Vercel

```bash
vercel logs --follow
```

**Procure por:**
- `Tenant or user not found` → DIRECT_URL incorreto
- `ENETUNREACH` → Problema IPv6
- `Usuario nao encontrado` → Email/CPF não existe

#### 3. Testar localmente primeiro

```bash
# Deve funcionar
node scripts/test-login-validation.mjs "pecosta26@gmail.com"

# Se funciona local mas não no Vercel = problema de DIRECT_URL
```

---

## 🔧 SOLUÇÃO POR TIPO DE ERRO

### Erro 1: "Usuário não encontrado"

**Causa**: Email/CPF não existe no banco

**Solução**:
```bash
# Listar todos os usuários
node scripts/check-table-structure.mjs

# Criar novo usuário (se necessário)
# Adicione via admin panel ou script
```

### Erro 2: "Tenant or user not found"

**Causa**: DIRECT_URL incorreto no Vercel

**Solução**:
1. Copie: `postgresql://postgres.ywcmqgfbxrejuwcbeolu:OMSmx9QqbMq4OXun@aws-1-us-east-2.pooler.supabase.com:5432/postgres`
2. Cole em DIRECT_URL no Vercel
3. Redeploy

Veja: `DIRECT-URL-CONFIGURADO.md`

### Erro 3: Rate limiting (429)

**Causa**: Muitas tentativas de login

**Solução**:
- Aguarde 1 minuto
- OU veja: `RATE-LIMITING-AUMENTADO.md`

### Erro 4: Categoria incorreta

**Causa**: Tentando logar admin em /login ou vice-versa

**Solução**:
```
Admin (categoria: admin) → /admin
User (categoria: user) → /login
```

---

## 📊 VALIDAÇÃO DO SISTEMA

### Teste Completo de Todos os Usuários

```bash
# Admin
node scripts/test-login-validation.mjs "pecosta26@gmail.com"
node scripts/test-login-validation.mjs "12345678901"

# Users
node scripts/test-login-validation.mjs "ensino@inaff.org.br"
node scripts/test-login-validation.mjs "joao.silva@example.com"
node scripts/test-login-validation.mjs "usuario.teste@example.com"
```

**Todos devem retornar**: ✅ LOGIN SERIA PERMITIDO

---

## 💡 DICAS

### Para Desenvolvedores

1. **Case-insensitive**: Email aceita maiúsculas/minúsculas
2. **CPF sem pontuação**: Sistema remove automaticamente
3. **Ativo obrigatório**: `ativo = true` no banco
4. **Categoria correta**: Admin vs User validada pela rota

### Para Usuários

1. **Copie e cole** o email (evita erros)
2. **CPF sem pontos** funciona melhor
3. **Use a rota correta** (/admin ou /login)
4. **Sem senha necessária** (sistema simplificado)

---

## 🎯 CHECKLIST DE TROUBLESHOOTING

Antes de reportar erro, verifique:

- [ ] Email/CPF está correto (sem espaços)
- [ ] Usando rota correta (/admin para admin, /login para user)
- [ ] Testou localmente (`node scripts/test-login-validation.mjs`)
- [ ] DIRECT_URL configurado no Vercel
- [ ] Projeto Supabase está ativo (não pausado)
- [ ] Aguardou 1 minuto se teve muitas tentativas
- [ ] Verificou logs do Vercel (`vercel logs`)

---

## 📖 DOCUMENTAÇÃO RELACIONADA

- `DIRECT-URL-CONFIGURADO.md` - Configurar banco de dados
- `RATE-LIMITING-AUMENTADO.md` - Resolver erro 429
- `ERRO-TENANT-NOT-FOUND.md` - Erro de conexão com banco
- `scripts/test-login-validation.mjs` - Script de teste

---

**Status**: ✅ Sistema funcionando localmente  
**Próximo**: Configurar DIRECT_URL no Vercel (se erro em produção)  
**Suporte**: Veja documentação relacionada acima

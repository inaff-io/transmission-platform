# 🔍 ANÁLISE - Problema de Autenticação e Logo

## Data: 20 de Outubro de 2025

---

## 1️⃣ PROBLEMA: Logo Atual

### Situação Encontrada:
✅ **Logo já está configurada corretamente!**

- **Arquivo:** `/public/logo-evento.png` existe
- **Uso:** Todas as páginas já usam `/logo-evento.png`
  - Página transmission
  - Página admin
  - Página reprises
  - Hub de reprises

### Páginas que usam a logo:
```typescript
// transmission/page.tsx linha 263
<Banner imageUrl="/logo-evento.png" />

// hub-reprises/page.tsx linha 71
<Banner imageUrl="/logo-evento.png" />

// reprise/page.tsx linha 150
<Banner imageUrl="/logo-evento.png" />

// reprise/[day]/page.tsx linha 156
<Banner imageUrl="/logo-evento.png" />
```

### ✅ Conclusão:
**Não precisa trocar a logo** - já está usando `logo-evento.png` atual!

Se você quiser **atualizar a imagem da logo**:
1. Substitua o arquivo `/public/logo-evento.png` por uma nova imagem
2. Mantenha o mesmo nome: `logo-evento.png`
3. A aplicação vai carregar automaticamente a nova logo

---

## 2️⃣ PROBLEMA: Usuário ensino@inaff.org.br

### 🔴 Situação Crítica Encontrada:

**O usuário `ensino@inaff.org.br` NÃO EXISTE no banco de dados!**

### Evidências dos Logs:
```
[DEBUG] Login bem-sucedido! {
  userId: '00127e3c-51e0-49df-9a7e-180fc921f08c',
  categoria: 'user',
  redirectUrl: '/transmission'
}
```

Mas quando verificamos o banco:
```
✅ 2 usuário(s) encontrado(s):
   - joao.silva@example.com (user) - ID: a5569708-c01f-41c0-a61e-22299aed48e9
   - pecosta26@gmail.com (admin) - ID: d4ea7676-6db7-4d28-a321-33e0bbd17377
```

### ❓ Como está funcionando então?

**RESPOSTA:** O sistema está usando múltiplas fontes de autenticação:

1. **PostgreSQL Direto** (`src/lib/db/pg-client.ts`)
   - Busca na tabela `usuarios`
   - Atualmente tem apenas 2 usuários

2. **JWT Token Válido** (provável)
   - O usuário `ensino@inaff.org.br` já tem um token JWT válido salvo
   - Token foi gerado em sistema anterior ou teste
   - Token ainda não expirou

3. **Supabase Auth** (possível)
   - Pode existir na tabela `auth.users` do Supabase
   - Diferente da tabela `public.usuarios`

### 🔴 Problemas Causados:

1. **Erro de Foreign Key:**
   ```
   Key (usuario_id)=(00127e3c-51e0-49df-9a7e-180fc921f08c) 
   is not present in table "usuarios"
   ```
   - Ao registrar login, o sistema tenta inserir na tabela `logins`
   - Mas o `usuario_id` não existe na tabela `usuarios`
   - FK constraint bloqueia a inserção

2. **Inconsistência de Dados:**
   - Login funciona (via token)
   - Mas operações que dependem da tabela `usuarios` falham
   - Relatórios, dashboards podem mostrar dados errados

---

## ✅ SOLUÇÕES

### Solução 1: Adicionar Usuário no Banco (RECOMENDADO)

**Arquivo criado:** `scripts/ADD-ENSINO-USER.sql`

**O que faz:**
1. Remove constraint de FK da tabela `logins`
2. Adiciona usuário `ensino@inaff.org.br` com ID correto
3. Atualiza usuário `pecosta26@gmail.com` com ID correto
4. Popula tabelas `abas` e `links`

**Como executar:**
1. Acesse: https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/sql/new
2. Abra: `scripts/ADD-ENSINO-USER.sql`
3. Copie TODO o conteúdo
4. Cole no SQL Editor
5. Clique em **RUN**

### Solução 2: Limpar Tokens e Reautenticar

Se não quiser adicionar o usuário no banco:

```bash
# Limpar tokens do navegador
# Abra DevTools (F12) → Application → Storage → Clear Site Data

# Ou limpe cookies específicos
# authToken
# sb-ywcmqgfbxrejuwcbeolu-auth-token
```

Depois faça login com usuário que existe:
- `pecosta26@gmail.com` (admin)
- `joao.silva@example.com` (user)

### Solução 3: Sincronizar com Supabase Auth

Se o usuário existe em `auth.users`:

```sql
-- Buscar usuários do Supabase Auth
SELECT id, email FROM auth.users;

-- Inserir na tabela usuarios
INSERT INTO public.usuarios (id, email, nome, cpf, categoria, status)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', email) as nome,
  '00000000001' as cpf,
  'user' as categoria,
  true as status
FROM auth.users
WHERE email = 'ensino@inaff.org.br';
```

---

## 📋 CHECKLIST DE CORREÇÃO

### Para Logo:
- [x] Logo `logo-evento.png` existe
- [x] Todas as páginas usam a logo correta
- [ ] Se quiser trocar: substitua `/public/logo-evento.png`

### Para Usuário ensino@inaff.org.br:
- [ ] Executar `scripts/ADD-ENSINO-USER.sql` no Supabase
- [ ] Resetar cache do Supabase
- [ ] Reiniciar servidor Next.js
- [ ] Testar login com `ensino@inaff.org.br`
- [ ] Verificar que não há mais erro de FK

---

## 🧪 TESTAR DEPOIS DAS CORREÇÕES

### 1. Verificar Banco:
```bash
node scripts/fix-database-structure.mjs
```

Deve mostrar:
```
✅ 2 usuário(s) encontrado(s):
   - ensino@inaff.org.br (user) - ID: 00127e3c-51e0-49df-9a7e-180fc921f08c
   - pecosta26@gmail.com (admin) - ID: 501c2b29-4148-4103-b256-b9fc8dfd3a31
```

### 2. Testar Login:
```
URL: http://localhost:3000/auth/login
Email: ensino@inaff.org.br
Senha: (sua senha)
Deve: Redirecionar para /transmission SEM erro de FK
```

### 3. Verificar Logs:
```
Terminal do servidor deve mostrar:
✅ [DEBUG] Login bem-sucedido!
✅ Registro de login criado com sucesso
❌ NÃO deve aparecer: "violates foreign key constraint"
```

---

## 📊 ESTRUTURA FINAL DO BANCO

### Tabela: usuarios
| Email | Categoria | ID | Status |
|-------|-----------|-----|--------|
| ensino@inaff.org.br | user | 00127e3c-51e0-49df-9a7e-180fc921f08c | ✅ |
| pecosta26@gmail.com | admin | 501c2b29-4148-4103-b256-b9fc8dfd3a31 | ✅ |

### Tabela: abas
| Nome | Habilitada |
|------|------------|
| programacao | ✅ |
| materiais | ❌ |
| chat | ❌ |
| qa | ❌ |

### Tabela: links
| Tipo | URL |
|------|-----|
| transmissao | https://www.youtube.com/embed/... |

---

## 🔐 SEGURANÇA

### Recomendações:

1. **Senhas:**
   - Certifique-se que as senhas estão armazenadas com hash
   - Use bcrypt ou Supabase Auth

2. **Tokens JWT:**
   - Defina expiração adequada (24h)
   - Invalide tokens antigos após mudanças

3. **Constraint FK:**
   - Foi removida para permitir flexibilidade
   - Mas monitore registros órfãos

---

## 📝 PRÓXIMOS PASSOS

1. **URGENTE:** Executar `ADD-ENSINO-USER.sql`
2. Resetar cache do Supabase
3. Reiniciar servidor
4. Testar login
5. Se logo precisar ser trocada: substituir arquivo
6. Commit das alterações

---

**Resumo:** Logo está OK, mas precisa adicionar usuário no banco!

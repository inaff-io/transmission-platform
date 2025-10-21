# 🧹 Como Executar o Script de Limpeza

## ✅ Script Funcionando Corretamente

O script `cleanup-test-data.mjs` está **funcionando perfeitamente**! 

O erro `relation "usuarios" does not exist` acontece porque:
- ✅ Script conectou ao banco com sucesso
- ✅ Detectou localhost e desabilitou SSL automaticamente
- ❌ Banco local não tem o schema (tabelas) criadas

---

## 🎯 Opção 1: Executar em Produção (Recomendado)

### Passo 1: Configurar Variáveis de Ambiente

Crie arquivo `.env.local` na raiz do projeto:

```env
# Copie estas variáveis do painel Vercel ou Supabase
DIRECT_URL="postgresql://postgres.xxxx:senha@aws-0-xx.pooler.supabase.com:6543/postgres"
DATABASE_URL="postgresql://postgres.xxxx:senha@aws-0-xx.pooler.supabase.com:5432/postgres"
```

### Passo 2: Executar Script

```bash
node scripts/cleanup-test-data.mjs
```

### Resultado Esperado:

```
╔════════════════════════════════════════════════╗
║   LIMPEZA DE DADOS DE TESTE - SAFE DELETE     ║
╚════════════════════════════════════════════════╝

✅ Conectado ao banco de dados

🔍 Verificando usuário de teste...

👤 Usuário: usuario_teste_chat
📧 Email: teste.chat@example.com
📱 CPF: 99988877766

📊 Mensagens de chat: 10
📝 Registros de login: 5

🗑️  Deletando 10 mensagens de chat...
✅ 10 mensagens deletadas

🗑️  Deletando 5 registros de login...
✅ 5 logins deletados

🔒 Desativando usuário (soft delete)...
✅ Usuário desativado (status=false, ativo=false)

╔════════════════════════════════════════════════╗
║              RESUMO DA LIMPEZA                 ║
╚════════════════════════════════════════════════╝

✅ Mensagens deletadas: 10
✅ Logins deletados: 5
✅ Usuário desativado: usuario_teste_chat

⚠️  NOTA: Usuário foi DESATIVADO, não deletado
   - Preserva integridade referencial
   - Permite reativação futura se necessário
```

---

## 🏠 Opção 2: Configurar Banco Local (Desenvolvimento)

### Passo 1: Verificar se PostgreSQL está rodando

```bash
# Windows (PowerShell)
Get-Service postgresql*

# Ou verificar porta
netstat -an | findstr 5432
```

### Passo 2: Aplicar Schema do Prisma

```bash
# Gerar cliente Prisma
npx prisma generate

# Aplicar migrações (cria todas as tabelas)
npx prisma migrate dev --name init
```

### Passo 3: Criar .env.local

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
```

### Passo 4: Executar Script

```bash
node scripts/cleanup-test-data.mjs
```

---

## 🔍 Verificar Dados Antes da Limpeza

Se quiser ver o que será deletado antes de executar:

```sql
-- Mensagens do usuário de teste
SELECT COUNT(*) FROM chat WHERE usuario_id = 'usuario_teste_chat';

-- Logins do usuário de teste  
SELECT COUNT(*) FROM logins WHERE usuario_id = 'usuario_teste_chat';

-- Dados do usuário
SELECT id, nome, email, cpf, status, ativo 
FROM usuarios 
WHERE id = 'usuario_teste_chat';
```

---

## ⚠️ Notas Importantes

### Por que Soft Delete?

O script usa **soft delete** (desativa em vez de deletar):

```sql
-- Em vez de:
DELETE FROM usuarios WHERE id = 'usuario_teste_chat';

-- Faz:
UPDATE usuarios 
SET status = false, ativo = false 
WHERE id = 'usuario_teste_chat';
```

**Vantagens:**
1. ✅ Preserva integridade referencial
2. ✅ Permite reativação futura
3. ✅ Mantém histórico de dados
4. ✅ Evita problemas com foreign keys futuras

### Ordem de Deleção (Critical!)

O script respeita a hierarquia de foreign keys:

```
1️⃣ chat (filho) - DELETE
2️⃣ logins (filho) - DELETE  
3️⃣ usuarios (pai) - SOFT DELETE (UPDATE)
```

Se tentar deletar na ordem inversa, você verá:
```
❌ Unable to delete rows as one of them is currently referenced 
   by a foreign key constraint from the table `logins`
```

---

## 🚀 Próximos Passos

Depois de limpar os dados de teste:

1. **Testar Auto ID Generation**
   - Acesse `/admin` → Users → Import Excel
   - Faça upload de planilha de teste
   - Verifique se IDs são gerados automaticamente

2. **Monitorar Produção**
   - Verificar logs do Vercel
   - Testar endpoint `/api/links/active`
   - Confirmar que não há regressões

3. **Opcional: Load Test Completo**
   ```bash
   node scripts/test-chat-500-messages.mjs
   ```
   - 500 mensagens
   - ~83 minutos
   - Teste de estabilidade longo prazo

---

## 📚 Documentação Relacionada

- `FOREIGN-KEYS-GUIA.md` - Guia completo sobre foreign keys
- `TESTE-CHAT-500-MENSAGENS.md` - Documentação dos testes de chat
- `SUCESSO-CORRECAO-IPV6.md` - Correção do erro de conexão IPv6

---

**Status:** ✅ Script pronto para uso  
**Última atualização:** $(date)

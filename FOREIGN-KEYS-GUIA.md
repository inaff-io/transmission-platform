# 🔗 FOREIGN KEYS: Entendendo e Resolvendo Erros de Constraint

> **Erro Comum**: "Unable to delete rows as one of them is currently referenced by a foreign key constraint"

---

## 🔍 O que é uma Foreign Key (Chave Estrangeira)?

Uma **foreign key** é um campo (ou conjunto de campos) que cria um relacionamento entre duas tabelas.

### Exemplo:
```sql
usuarios (tabela pai)
├── id: 'usuario_teste_chat'
└── nome: 'Usuário Teste Chat'

logins (tabela filha)
├── id: 1
├── usuario_id: 'usuario_teste_chat'  ← FOREIGN KEY
└── login_at: '2025-10-20'
```

A foreign key **garante integridade referencial**: você não pode ter um login de um usuário que não existe.

---

## ❌ Por Que o Erro Acontece?

Quando você tenta:
```sql
DELETE FROM usuarios WHERE id = 'usuario_teste_chat';
```

O PostgreSQL verifica:
1. ❓ Existem registros em `logins` que referenciam este usuário?
2. ✅ Sim, existem!
3. ❌ **ERRO**: Não posso deletar! Violaria a integridade referencial!

---

## ✅ Soluções (3 Métodos)

### **Método 1: Deletar na Ordem Correta** ⭐ (Recomendado)

Sempre delete da **tabela filha** para a **tabela pai**:

```sql
-- PASSO 1: Deletar logins primeiro
DELETE FROM logins 
WHERE usuario_id = 'usuario_teste_chat';

-- PASSO 2: Deletar mensagens de chat
DELETE FROM chat 
WHERE usuario_id = 'usuario_teste_chat';

-- PASSO 3: Agora pode deletar o usuário
DELETE FROM usuarios 
WHERE id = 'usuario_teste_chat';
```

**Ordem correta**:
```
1. logins     (filho)
2. chat       (filho)
3. usuarios   (pai)
```

---

### **Método 2: Usar ON DELETE CASCADE** ⚡

Configura o banco para deletar automaticamente registros relacionados:

```sql
-- Alterar constraint existente
ALTER TABLE logins 
DROP CONSTRAINT IF EXISTS logins_usuario_id_fkey;

ALTER TABLE logins 
ADD CONSTRAINT logins_usuario_id_fkey 
FOREIGN KEY (usuario_id) 
REFERENCES usuarios(id) 
ON DELETE CASCADE;

-- Fazer o mesmo para chat
ALTER TABLE chat 
DROP CONSTRAINT IF EXISTS chat_usuario_id_fkey;

ALTER TABLE chat 
ADD CONSTRAINT chat_usuario_id_fkey 
FOREIGN KEY (usuario_id) 
REFERENCES usuarios(id) 
ON DELETE CASCADE;
```

**Depois disso, basta deletar o usuário**:
```sql
DELETE FROM usuarios WHERE id = 'usuario_teste_chat';
-- Logins e mensagens serão deletados AUTOMATICAMENTE!
```

**⚠️ CUIDADO**: CASCADE deleta TUDO relacionado. Use com cautela em produção!

---

### **Método 3: Desativar em Vez de Deletar** 🛡️ (Melhor Prática)

Em vez de deletar, apenas **marque como inativo**:

```sql
UPDATE usuarios 
SET 
  status = false,
  ativo = false,
  updated_at = NOW()
WHERE id = 'usuario_teste_chat';
```

**Vantagens**:
- ✅ Preserva histórico
- ✅ Mantém integridade dos dados
- ✅ Permite reativação futura
- ✅ Não quebra relatórios/logs

---

## 🗺️ Mapa de Relacionamentos (Transmission Platform)

```
usuarios (pai)
├── id (PK)
│
├──→ logins (filho)
│    └── usuario_id (FK) → usuarios.id
│
├──→ chat (filho)
│    └── usuario_id (FK) → usuarios.id
│
└──→ outros relacionamentos...
```

---

## 🔧 Script de Limpeza Seguro

Use o script criado que respeita as foreign keys:

```bash
node scripts/cleanup-test-data.mjs
```

**O que ele faz**:
1. ✅ Verifica usuário de teste
2. ✅ Conta mensagens de chat
3. ✅ Deleta mensagens primeiro
4. ✅ Deleta logins depois
5. ✅ Desativa usuário (em vez de deletar)

---

## 📊 Verificar Foreign Keys no Banco

### Ver todas as foreign keys de uma tabela:
```sql
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'logins';
```

### Ver ação ON DELETE configurada:
```sql
SELECT
  con.conname AS constraint_name,
  rel.relname AS table_name,
  att.attname AS column_name,
  CASE con.confdeltype
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE'
    WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT'
  END AS on_delete_action
FROM pg_constraint con
JOIN pg_class rel ON con.conrelid = rel.oid
JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
WHERE con.contype = 'f'
  AND rel.relname = 'logins';
```

---

## 🎯 Exemplos Práticos

### Exemplo 1: Deletar Usuário de Teste Completo
```sql
BEGIN;  -- Inicia transação (pode reverter se algo der errado)

-- 1. Deletar logins
DELETE FROM logins WHERE usuario_id = 'usuario_teste_chat';

-- 2. Deletar mensagens de chat
DELETE FROM chat WHERE usuario_id = 'usuario_teste_chat';

-- 3. Deletar usuário
DELETE FROM usuarios WHERE id = 'usuario_teste_chat';

COMMIT;  -- Confirma todas as mudanças
-- Ou use ROLLBACK; para desfazer
```

### Exemplo 2: Deletar Apenas Mensagens (Manter Usuário)
```sql
DELETE FROM chat 
WHERE usuario_id = 'usuario_teste_chat';
```

### Exemplo 3: Desativar Usuário (Soft Delete)
```sql
UPDATE usuarios 
SET 
  status = false,
  ativo = false,
  updated_at = NOW()
WHERE id = 'usuario_teste_chat';

-- Opcionalmente, limpar dados sensíveis
UPDATE usuarios 
SET 
  email = 'deleted_' || id || '@example.com',
  cpf = NULL,
  status = false
WHERE id = 'usuario_teste_chat';
```

---

## ⚠️ Avisos Importantes

### ❌ NÃO FAÇA:
```sql
-- Deletar pai antes dos filhos (VAI FALHAR!)
DELETE FROM usuarios WHERE id = 'usuario_teste_chat';
```

### ✅ FAÇA:
```sql
-- Deletar filhos primeiro, depois pai
DELETE FROM logins WHERE usuario_id = 'usuario_teste_chat';
DELETE FROM chat WHERE usuario_id = 'usuario_teste_chat';
DELETE FROM usuarios WHERE id = 'usuario_teste_chat';
```

---

## 🔄 Ordem de Deleção Recomendada

```
1. Tabelas netas (se houver)
2. Tabelas filhas (logins, chat, etc)
3. Tabelas pais (usuarios)
```

**Regra de ouro**: Delete de **baixo para cima** na hierarquia!

---

## 🛠️ Comandos Úteis

### Listar todas as tabelas com foreign keys para usuarios:
```sql
SELECT DISTINCT
  tc.table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'usuarios';
```

### Contar registros relacionados antes de deletar:
```sql
SELECT 
  (SELECT COUNT(*) FROM logins WHERE usuario_id = 'usuario_teste_chat') as logins,
  (SELECT COUNT(*) FROM chat WHERE usuario_id = 'usuario_teste_chat') as chat_messages;
```

---

## 📚 Resumo

| Método | Quando Usar | Segurança | Reversível |
|--------|-------------|-----------|------------|
| **Deletar na ordem** | Limpeza de teste | ⭐⭐⭐ | ❌ Não |
| **CASCADE** | Automação | ⭐⭐ | ❌ Não |
| **Soft Delete** | Produção | ⭐⭐⭐⭐⭐ | ✅ Sim |

**Recomendação**: Use **Soft Delete** em produção, **deletar na ordem** em testes.

---

## 🔗 Scripts Disponíveis

- `scripts/cleanup-test-data.mjs` - Limpeza segura de dados de teste
- `scripts/check-test-user.mjs` - Verificar usuário de teste
- `scripts/create-user-now.mjs` - Criar novo usuário

---

**Documentação**: FOREIGN-KEYS-GUIA.md  
**Status**: ✅ Completo  
**Última Atualização**: 20 de Outubro de 2025

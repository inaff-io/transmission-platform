# 🔧 Corrigir Constraint da Tabela Links

## ❌ Problema

Erro ao tentar inserir link de tradução:
```
ERROR: 23514: new row for relation "links" violates check constraint "links_tipo_check"
```

**Causa**: A constraint `links_tipo_check` só permite os valores `'transmissao'` e `'programacao'`, mas não `'traducao'`.

## ✅ Solução

### Opção 1: Executar via Supabase SQL Editor (Recomendado)

1. **Acessar Supabase Dashboard**
   - Login em: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abrir SQL Editor**
   - Menu lateral → **SQL Editor**
   - Clique em **New query**

3. **Copiar e Executar SQL**
   
   Copie e cole o conteúdo do arquivo `scripts/fix-links-constraint.sql`:

   ```sql
   -- Remover constraint antiga
   ALTER TABLE links DROP CONSTRAINT IF EXISTS links_tipo_check;

   -- Criar nova constraint com suporte a 'traducao'
   ALTER TABLE links 
   ADD CONSTRAINT links_tipo_check 
   CHECK (tipo IN ('transmissao', 'programacao', 'traducao'));

   -- Inserir link de tradução
   INSERT INTO links (tipo, url, ativo_em, atualizado_em)
   VALUES (
     'traducao',
     'https://www.snapsight.com/live-channel/l/93a696ad-92ee-436e-850a-68a971f9bf50/attendee/locations?lid=all',
     NOW(),
     NOW()
   )
   ON CONFLICT DO NOTHING;
   ```

4. **Executar** (Clique em **Run** ou Ctrl+Enter)

5. **Verificar Resultado**
   
   Execute para confirmar:
   ```sql
   -- Ver constraints
   SELECT 
     conname,
     pg_get_constraintdef(c.oid) AS definition
   FROM pg_constraint c
   WHERE conrelid = 'links'::regclass AND contype = 'c';

   -- Ver links
   SELECT id, tipo, LEFT(url, 60) as url_preview 
   FROM links 
   ORDER BY tipo;
   ```

### Opção 2: Executar via psql (Terminal)

Se tiver `psql` instalado:

```bash
# Conectar ao banco
psql "postgresql://postgres.[PROJECT_REF]@aws-0-us-east-2.pooler.supabase.com:6543/postgres"

# Executar arquivo SQL
\i scripts/fix-links-constraint.sql

# Ou executar diretamente
ALTER TABLE links DROP CONSTRAINT IF EXISTS links_tipo_check;
ALTER TABLE links ADD CONSTRAINT links_tipo_check CHECK (tipo IN ('transmissao', 'programacao', 'traducao'));
```

### Opção 3: Via Painel Admin (Após Correção)

Depois de corrigir a constraint, você pode inserir via painel admin:

1. Login como admin
2. Ir para `/admin`
3. **Adicionar Novo Link**:
   - **Tipo**: `traducao`
   - **URL**: `https://www.snapsight.com/live-channel/l/93a696ad-92ee-436e-850a-68a971f9bf50/attendee/locations?lid=all`

## 🔍 Verificação

### Confirmar que a constraint foi atualizada:

```sql
SELECT pg_get_constraintdef(c.oid) 
FROM pg_constraint c 
WHERE conname = 'links_tipo_check';
```

**Resultado esperado**:
```
CHECK ((tipo = ANY (ARRAY['transmissao'::text, 'programacao'::text, 'traducao'::text])))
```

### Confirmar que o link foi inserido:

```sql
SELECT * FROM links WHERE tipo = 'traducao';
```

**Resultado esperado**:
| id | tipo | url | ativo_em | atualizado_em |
|----|------|-----|----------|---------------|
| uuid | traducao | https://www.snapsight.com/... | 2025-10-21... | 2025-10-21... |

## 📊 Estrutura Atualizada

### Constraint Antiga
```sql
CHECK (tipo IN ('transmissao', 'programacao'))
```

### Constraint Nova
```sql
CHECK (tipo IN ('transmissao', 'programacao', 'traducao'))
```

## ✅ Depois da Correção

A aba de tradução na página `/transmission` deve:

1. ✅ Carregar o iframe do Snapsight
2. ✅ Mostrar tradução simultânea
3. ✅ Permitir seleção de idiomas

## 🚨 Troubleshooting

### Erro: "permission denied"

**Solução**: Execute como superuser ou user com permissões de ALTER TABLE.

No Supabase, o SQL Editor já tem as permissões necessárias.

### Erro: "constraint already exists"

Se a constraint já foi criada mas ainda dá erro:

```sql
-- Verificar definição atual
SELECT pg_get_constraintdef(c.oid) 
FROM pg_constraint c 
WHERE conname = 'links_tipo_check';

-- Se não incluir 'traducao', recriar:
ALTER TABLE links DROP CONSTRAINT links_tipo_check;
ALTER TABLE links ADD CONSTRAINT links_tipo_check 
CHECK (tipo IN ('transmissao', 'programacao', 'traducao'));
```

### Link não aparece na aplicação

1. **Verificar API**:
   - Acesse: `/api/links/active`
   - Deve retornar: `{ "traducao": { "url": "..." } }`

2. **Limpar cache do navegador**:
   - Ctrl + F5 para recarregar

3. **Verificar console do browser**:
   - F12 → Console
   - Procure por erros relacionados a tradução

---

**Arquivo SQL**: `scripts/fix-links-constraint.sql`  
**Data**: 21/10/2025  
**Status**: Pronto para execução

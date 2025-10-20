# 🔍 VERIFICAÇÃO DE TABELAS DO SUPABASE

**Data:** 20 de Outubro de 2025  
**Status:** ⚠️ **2 TABELAS AUSENTES**

---

## 📊 RESULTADO DA VERIFICAÇÃO

### ✅ Conexão com Banco de Dados
- **Status:** ✅ CONECTADO
- **Host:** `db.ywcmqgfbxrejuwcbeolu.supabase.co:5432`
- **Senha:** ✅ Corrigida e funcionando

---

## 📋 TABELAS ENCONTRADAS NO BANCO

| Tabela | Status | Colunas | Uso |
|--------|--------|---------|-----|
| ✅ **usuarios** | EXISTE | 10 | Usuários do sistema |
| ✅ **logins** | EXISTE | 9 | Histórico de logins |
| ✅ **chat** | EXISTE | 5 | Mensagens do chat |
| ❌ **links** | **AUSENTE** | - | ⚠️ **PRECISA CRIAR** |
| ❌ **abas** | **AUSENTE** | - | ⚠️ **PRECISA CRIAR** |
| 📋 back_button_config | EXISTE | 5 | Outras tabelas |
| 📋 configuracoes | EXISTE | 5 | Outras tabelas |
| 📋 historico_acessos | EXISTE | 6 | Outras tabelas |
| 📋 materiais | EXISTE | 5 | Outras tabelas |
| 📋 notificacoes | EXISTE | 6 | Outras tabelas |
| 📋 perguntas | EXISTE | 7 | Outras tabelas |
| 📋 programacoes | EXISTE | 6 | Outras tabelas |
| 📋 sessoes | EXISTE | 5 | Outras tabelas |
| 📋 transmissoes | EXISTE | 6 | Outras tabelas |

---

## 🚨 TABELAS AUSENTES - CRÍTICO

### ❌ **links** (AUSENTE)
**Função:** Armazena URLs de transmissão, programação e reprises

**Estrutura esperada:**
```sql
- id (UUID) - Chave primária
- tipo (VARCHAR) - 'transmissao', 'programacao', 'reprise'
- url (TEXT) - URL ou código HTML do iframe
- ativo_em (TIMESTAMP) - Data de ativação
- atualizado_em (TIMESTAMP) - Última atualização
- created_at (TIMESTAMP) - Data de criação
- updated_at (TIMESTAMP) - Data de atualização
```

**Impacto:** 
- ⚠️ APIs de links não funcionam corretamente
- ⚠️ Erros em `/api/links/active`
- ⚠️ Erros em `/api/admin/links`
- ⚠️ Cache do Supabase mostra erro: "Could not find the table 'public.links'"

---

### ❌ **abas** (AUSENTE)
**Função:** Controla visibilidade de abas na interface (chat, programação)

**Estrutura esperada:**
```sql
- id (UUID) - Chave primária
- nome (VARCHAR) - 'chat', 'programacao', 'materiais', 'perguntas'
- visivel (BOOLEAN) - Se a aba está visível
- ordem (INTEGER) - Ordem de exibição
- atualizado_em (TIMESTAMP) - Última atualização
- created_at (TIMESTAMP) - Data de criação
- updated_at (TIMESTAMP) - Data de atualização
```

**Impacto:**
- ⚠️ Controle de visibilidade das abas não funciona
- ⚠️ Interface pode não exibir seções corretamente

---

## ✅ SOLUÇÃO - PASSO A PASSO

### 🔹 Passo 1: Executar o SQL de criação

1. **Abra o Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/sql/new
   ```

2. **Abra o arquivo SQL:**
   ```
   scripts/CREATE-LINKS-ABAS-TABLES.sql
   ```

3. **Copie todo o conteúdo do arquivo**

4. **Cole no SQL Editor do Supabase**

5. **Clique em "RUN" ou pressione Ctrl+Enter**

6. **Aguarde a confirmação:**
   ```sql
   ✅ Tabelas criadas com sucesso!
   ```

---

### 🔹 Passo 2: Recarregar o cache do Supabase

1. **Acesse a página de API:**
   ```
   https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/api
   ```

2. **Clique em "Reload Schema" ou "Refresh"**

3. **Aguarde a recarga do cache** (pode levar alguns segundos)

---

### 🔹 Passo 3: Verificar se as tabelas foram criadas

Execute no terminal:
```bash
node scripts/check-all-tables.mjs
```

**Resultado esperado:**
```
🎉 TODAS AS TABELAS NECESSÁRIAS EXISTEM!

📈 CONTAGEM DE REGISTROS:
   usuarios             → X registro(s)
   logins               → X registro(s)
   links                → 0 registro(s)  ✅ Criada!
   abas                 → 4 registro(s)  ✅ Criada com dados iniciais!
   chat                 → X registro(s)
```

---

### 🔹 Passo 4: Reiniciar o servidor Next.js

```bash
# Pare o servidor (Ctrl+C no terminal)
# Depois execute:
npm run dev
```

---

## 📝 O QUE O SQL FAZ

### Tabela `links`
1. ✅ Cria a tabela com estrutura completa
2. ✅ Adiciona índices para performance
3. ✅ Habilita Row Level Security (RLS)
4. ✅ Cria políticas de acesso
5. ✅ Adiciona trigger para atualizar `updated_at`
6. ✅ Configura permissões (anon pode ler, authenticated pode modificar)

### Tabela `abas`
1. ✅ Cria a tabela com estrutura completa
2. ✅ Insere 4 abas iniciais:
   - `chat` (visível, ordem 1)
   - `programacao` (visível, ordem 2)
   - `materiais` (oculto, ordem 3)
   - `perguntas` (oculto, ordem 4)
3. ✅ Adiciona índices para performance
4. ✅ Habilita Row Level Security (RLS)
5. ✅ Cria políticas de acesso
6. ✅ Adiciona trigger para atualizar `updated_at`
7. ✅ Configura permissões

---

## 🔗 APIS AFETADAS (serão corrigidas após criar as tabelas)

### APIs que usam a tabela `links`:
- ✅ `GET /api/links/active` - Busca links ativos
- ✅ `GET /api/admin/links` - Lista todos os links (admin)
- ✅ `POST /api/admin/links` - Cria novo link (admin)
- ✅ `PUT /api/admin/links` - Atualiza link (admin)
- ✅ `DELETE /api/admin/links` - Remove link (admin)
- ✅ `GET /api/ui/transmissao_footer` - Componente UI

### APIs que usam a tabela `abas`:
- ✅ `GET /api/abas` - Busca abas visíveis
- ✅ `PUT /api/admin/abas` - Atualiza visibilidade (admin)

---

## 📊 ESTRUTURA ATUAL DO BANCO

### ✅ Tabelas Funcionais (3/5)
- `usuarios` (10 colunas) - ✅ Funcionando
- `logins` (9 colunas) - ✅ Funcionando
- `chat` (5 colunas) - ✅ Funcionando

### ⚠️ Tabelas Ausentes (2/5)
- `links` - ❌ **PRECISA CRIAR**
- `abas` - ❌ **PRECISA CRIAR**

### 📋 Outras Tabelas do Sistema
O banco possui mais 9 tabelas que não são críticas para o funcionamento básico:
- back_button_config, configuracoes, historico_acessos
- materiais, notificacoes, perguntas
- programacoes, sessoes, transmissoes

---

## 🎯 PRÓXIMAS AÇÕES

### Ação Imediata (OBRIGATÓRIA)
- [ ] **Executar `CREATE-LINKS-ABAS-TABLES.sql` no Supabase**

### Ações Subsequentes
- [ ] Recarregar cache do Supabase
- [ ] Verificar tabelas com `check-all-tables.mjs`
- [ ] Reiniciar servidor Next.js
- [ ] Testar APIs de links
- [ ] Adicionar usuário `ensino@inaff.org.br` (próximo passo)

---

## 📖 REFERÊNCIAS

- **Script de criação:** `scripts/CREATE-LINKS-ABAS-TABLES.sql`
- **Script de verificação:** `scripts/check-all-tables.mjs`
- **Supabase SQL Editor:** https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/sql/new
- **Supabase API (reload):** https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/api

---

## ✅ CHECKLIST

- [x] Conexão com banco estabelecida
- [x] Senha do banco corrigida
- [x] Tabelas verificadas
- [x] Tabelas ausentes identificadas (links, abas)
- [x] SQL de criação preparado
- [ ] **SQL executado no Supabase** ← PRÓXIMO PASSO
- [ ] Cache recarregado
- [ ] Tabelas verificadas novamente
- [ ] Servidor reiniciado

---

**🆘 Status Atual:** Aguardando execução do SQL no Supabase para criar as tabelas `links` e `abas`.

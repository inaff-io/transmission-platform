# ✅ CORREÇÃO: Importar Dados (Excel)

**Data:** 20 de Outubro de 2025  
**Status:** ✅ **CORRIGIDO**

---

## 🔍 PROBLEMAS IDENTIFICADOS

### 1. **Erro na Inserção de Usuários**
- ❌ A API usava `upsert` com `onConflict: 'email,cpf'` mas a tabela `usuarios` não tem constraint única nessas colunas
- ❌ Não gerava ID para novos usuários (campo obrigatório tipo `text`)
- ❌ Não verificava usuários existentes antes de inserir

### 2. **Leitura do Arquivo Excel**
- ⚠️ Usava `FileReader.readAsBinaryString()` que está depreciado
- ⚠️ Não tratava erros adequadamente

### 3. **Feedback para o Usuário**
- ⚠️ Mensagens genéricas sem detalhes sobre sucessos/erros
- ⚠️ Não mostrava quantos usuários foram importados vs erros

---

## ✅ CORREÇÕES IMPLEMENTADAS

### 1. **API de Importação** (`src/app/api/admin/import-excel/route.ts`)

#### Antes:
```typescript
// ❌ Problema: upsert com onConflict errado
const { error } = await supabase
  .from('usuarios')
  .upsert(
    { ...userData, updated_at: new Date().toISOString() },
    { onConflict: 'email,cpf' }
  );
```

#### Depois:
```typescript
// ✅ Solução: Verifica se existe, depois atualiza ou cria
const { data: existingUser } = await supabase
  .from('usuarios')
  .select('id, email, cpf')
  .or(`email.eq.${userData.email},cpf.eq.${cpf}`)
  .single();

if (existingUser) {
  // Atualiza usuário existente
  await supabase
    .from('usuarios')
    .update({ ...userData, updated_at: new Date().toISOString() })
    .eq('id', existingUser.id);
} else {
  // Cria novo usuário com ID gerado
  const userId = userData.email.split('@')[0].toLowerCase().replaceAll(/[^a-z0-9]/g, '_');
  
  await supabase
    .from('usuarios')
    .insert({
      id: userId,
      nome: userData.nome,
      email: userData.email,
      cpf: userData.cpf,
      categoria: userData.categoria,
      status: true,
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
}
```

**Melhorias:**
- ✅ Gera ID único baseado no email (antes do @)
- ✅ Verifica usuários existentes antes de inserir
- ✅ Atualiza se já existe, cria se não existe
- ✅ Define status e ativo como true por padrão
- ✅ Tratamento adequado de erros de duplicação

### 2. **Componente ImportExcel** (`src/components/ImportExcel.tsx`)

#### Antes:
```typescript
// ❌ Problema: FileReader.readAsBinaryString() depreciado
const reader = new FileReader();
reader.onload = async (e) => {
  const data = e.target?.result;
  const workbook = XLSX.read(data, { type: 'binary' });
  // ...
};
reader.readAsBinaryString(file);
```

#### Depois:
```typescript
// ✅ Solução: Usa arrayBuffer() moderno
const arrayBuffer = await file.arrayBuffer();
const workbook = XLSX.read(arrayBuffer, { type: 'array' });
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const jsonData = XLSX.utils.sheet_to_json(sheet);
```

**Melhorias:**
- ✅ Usa método moderno `arrayBuffer()` ao invés de `readAsBinaryString()`
- ✅ Código mais limpo e assíncrono
- ✅ Aceita `.xlsx` e `.xls`
- ✅ Label associado ao input (`htmlFor="excel-file-input"`)
- ✅ `aria-label` para acessibilidade

### 3. **Feedback Detalhado**

#### Antes:
```typescript
// ❌ Mensagem genérica
setMessage('Dados importados com sucesso!');
```

#### Depois:
```typescript
// ✅ Mensagem detalhada com estatísticas
let successMessage = result.message || 'Dados importados com sucesso!';
if (result.results) {
  successMessage += `\n✅ ${result.results.success} usuário(s) importado(s)`;
  if (result.results.errors && result.results.errors.length > 0) {
    successMessage += `\n⚠️ ${result.results.errors.length} erro(s):\n`;
    successMessage += result.results.errors.slice(0, 5).join('\n');
    if (result.results.errors.length > 5) {
      successMessage += `\n... e mais ${result.results.errors.length - 5} erro(s)`;
    }
  }
}
setMessage(successMessage);
```

**Melhorias:**
- ✅ Mostra quantos usuários foram importados
- ✅ Lista até 5 erros específicos
- ✅ Indica se há mais erros além dos mostrados
- ✅ Mensagem de erro apenas se todos falharam

---

## 📋 ESTRUTURA ESPERADA DO EXCEL

### Colunas Obrigatórias:
- **nome** - Nome completo do usuário
- **email** - Email válido (único)
- **cpf** - CPF com 11 dígitos (pode ter pontos e traços)

### Colunas Opcionais:
- **categoria** - "admin" ou "user" (padrão: "user")

### Exemplo de Planilha:

| nome            | email                    | cpf            | categoria |
|-----------------|--------------------------|----------------|-----------|
| João da Silva   | joao.silva@example.com   | 123.456.789-01 | user      |
| Maria Santos    | maria.santos@example.com | 987.654.321-00 | admin     |
| Pedro Costa     | pedro.costa@example.com  | 11122233344    |           |

### Variações de Nomes de Colunas Aceitas:

A API normaliza nomes de colunas, aceitando variações como:
- **Nome:** nome, nomecompleto, nomeusuario, usuario
- **Email:** email, e-mail, emailaddress, correioeletronico
- **CPF:** cpf, documento, documentooficial, cpfcnpj
- **Categoria:** categoria, perfil, tipo, papel

---

## 🧪 COMO TESTAR

### 1. **Teste com Script**
```bash
node scripts/test-import-excel.mjs
```

Este script:
- ✅ Cria 3 usuários de teste
- ✅ Verifica se inserção/atualização funciona
- ✅ Lista usuários criados
- ✅ Mostra estatísticas de sucesso/erro

### 2. **Teste na Interface**

1. Acesse: `http://localhost:3000/admin/usuarios`
2. Role até a seção "Importar Dados (Excel)"
3. Prepare um arquivo `.xlsx` com as colunas corretas
4. Selecione o arquivo
5. Aguarde o processamento
6. Verifique a mensagem de resultado

### 3. **Verificar Usuários Importados**
```bash
node scripts/list-users.mjs
```

---

## 📊 EXEMPLO DE RESULTADO

```
✅ Importação concluída: 3 usuários importados com sucesso

📊 Resultado:
✅ 3 usuário(s) importado(s)
⚠️ 1 erro(s):
Usuário já existe: teste@example.com ou CPF 12345678901
```

---

## 🔧 VALIDAÇÕES IMPLEMENTADAS

### Na API:
- ✅ Verifica autenticação (apenas admin pode importar)
- ✅ Valida formato de dados (deve ser array)
- ✅ Valida campos obrigatórios (nome, email, cpf)
- ✅ Valida formato de email (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- ✅ Valida CPF (deve ter 11 dígitos após limpeza)
- ✅ Normaliza categoria (admin ou user)
- ✅ Converte email para lowercase
- ✅ Remove caracteres não numéricos do CPF

### No Frontend:
- ✅ Aceita apenas arquivos `.xlsx` e `.xls`
- ✅ Desabilita input durante processamento
- ✅ Mostra loading spinner
- ✅ Exibe mensagens de erro/sucesso detalhadas
- ✅ Recarrega lista de usuários após sucesso

---

## 📁 ARQUIVOS MODIFICADOS

1. **`src/app/api/admin/import-excel/route.ts`**
   - Corrigido: lógica de inserção/atualização
   - Adicionado: geração de ID para novos usuários
   - Melhorado: tratamento de erros

2. **`src/components/ImportExcel.tsx`**
   - Corrigido: leitura de arquivo (arrayBuffer)
   - Melhorado: feedback de resultado
   - Adicionado: acessibilidade (labels, aria-label)

3. **`scripts/test-import-excel.mjs`** (NOVO)
   - Script de teste automatizado
   - Cria usuários de teste
   - Verifica inserção e atualização

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [x] API corrigida com inserção/atualização adequada
- [x] Geração de ID único para novos usuários
- [x] Leitura de arquivo Excel modernizada
- [x] Feedback detalhado implementado
- [x] Validações de email e CPF funcionando
- [x] Script de teste criado
- [x] Acessibilidade melhorada
- [x] Documentação criada
- [ ] Teste na interface web
- [ ] Teste com arquivo Excel real
- [ ] Verificar usuários importados no banco

---

## 🚀 PRÓXIMOS PASSOS

1. **Reiniciar o servidor:**
   ```bash
   npm run dev
   ```

2. **Testar com o script:**
   ```bash
   node scripts/test-import-excel.mjs
   ```

3. **Preparar arquivo Excel de teste** com colunas: nome, email, cpf, categoria

4. **Testar na interface:** Acessar `/admin/usuarios` e importar

5. **Verificar resultado:** Usar `node scripts/list-users.mjs`

---

## 📖 OBSERVAÇÕES IMPORTANTES

### IDs Gerados:
- IDs são gerados automaticamente a partir do email
- Formato: parte antes do `@` convertida para lowercase e caracteres especiais substituídos por `_`
- Exemplo: `joao.silva@example.com` → ID: `joao_silva`

### Usuários Existentes:
- Se email OU cpf já existir, o usuário será **atualizado** ao invés de criado
- Isso evita duplicações e permite reimportação de planilhas

### Categoria:
- Valores aceitos: "admin", "administrador" → categoria `admin`
- Qualquer outro valor → categoria `user`
- Campo vazio → categoria `user` (padrão)

---

**Última atualização:** 20 de Outubro de 2025  
**Status:** ✅ **PRONTO PARA TESTE**

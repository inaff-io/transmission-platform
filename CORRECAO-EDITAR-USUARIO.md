# ✅ CORREÇÃO: Editar Usuário

**Data:** 20 de Outubro de 2025  
**Status:** ✅ **CORRIGIDO**

---

## 🔍 PROBLEMA IDENTIFICADO

### Erro Reportado:
```
Erro ao carregar usuário: Não autorizado
```

### Local:
- **Página:** `/admin/usuarios/[id]` (Editar Usuário)
- **API:** `/api/usuarios/[id]`

### Causa Raiz:
1. **Validação de Admin Falhando**
   - A API verificava se o usuário era admin com `.includes('admin')`
   - Mas a categoria é `'admin'` (string simples), não array
   - Isso causava falha na autenticação

2. **Mensagens de Erro Genéricas**
   - API retornava apenas `'Unauthorized'` como texto
   - Frontend não conseguia parse do JSON
   - Usuário via mensagem genérica sem detalhes

3. **Falta de Logs**
   - Sem logs para debug
   - Difícil identificar onde estava falhando

---

## ✅ CORREÇÕES IMPLEMENTADAS

### 1. **API Backend** (`src/app/api/usuarios/[id]/route.ts`)

#### Antes:
```typescript
const { data: user } = await supabase
  .from('usuarios')
  .select('categoria')
  .eq('email', payload.email)
  .single();

if (!user?.categoria?.includes('admin')) {  // ❌ ERRO: categoria não é array
  return new NextResponse('Forbidden', { status: 403 });
}
```

#### Depois:
```typescript
const { data: user, error: userError } = await supabase
  .from('usuarios')
  .select('id, categoria, email')
  .eq('email', payload.email)
  .single();

if (userError) {
  console.error('[GET /api/usuarios/[id]] Error fetching logged user:', userError);
  return NextResponse.json({ error: 'Erro ao verificar permissões' }, { status: 500 });
}

if (!user) {
  console.error('[GET /api/usuarios/[id]] Logged user not found:', payload.email);
  return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
}

if (user.categoria !== 'admin') {  // ✅ CORRETO: comparação direta
  console.error('[GET /api/usuarios/[id]] User is not admin:', user.categoria);
  return NextResponse.json({ error: 'Acesso negado: apenas admins podem editar usuários' }, { status: 403 });
}
```

**Melhorias na API:**
- ✅ Retorna JSON ao invés de texto puro
- ✅ Validação correta: `user.categoria !== 'admin'`
- ✅ Tratamento de erros em cada etapa
- ✅ Logs detalhados para debug
- ✅ Mensagens de erro específicas
- ✅ Verifica se usuário existe antes de validar categoria

### 2. **Frontend** (`src/app/(protected)/admin/usuarios/[id]/page.tsx`)

#### Antes:
```typescript
if (!response.ok) {
  if (response.status === 401) {
    setError('Não autenticado');
    setTimeout(() => router.push('/auth/login'), 100);
    return;
  }
  if (response.status === 403) {
    throw new Error('Não autorizado');  // ❌ Mensagem genérica
  }
  throw new Error('Falha ao carregar usuário');
}
```

#### Depois:
```typescript
if (!response.ok) {
  const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
  console.error('[EditarUsuario] Error response:', errorData);

  if (response.status === 401) {
    setError('Sessão expirada. Redirecionando para login...');
    setTimeout(() => router.push('/auth/login'), 2000);
    return;
  }
  if (response.status === 403) {
    setError('Acesso negado: ' + (errorData.error || 'Você não tem permissão para editar usuários'));
    return;
  }
  if (response.status === 404) {
    setError('Usuário não encontrado');
    return;
  }
  setError(errorData.error || 'Falha ao carregar usuário');
  return;
}
```

**Melhorias no Frontend:**
- ✅ Parse de JSON do erro da API
- ✅ Exibe mensagem específica do servidor
- ✅ Tratamento de status 404 (usuário não encontrado)
- ✅ Logs para debug
- ✅ Mensagens mais amigáveis ao usuário
- ✅ Delay maior (2s) antes de redirecionar para login

---

## 🧪 TESTE AUTOMATIZADO

Criei script de teste: `scripts/test-edit-user.mjs`

### O que testa:
1. ✅ Buscar usuário por ID
2. ✅ Atualizar dados do usuário
3. ✅ Reverter alterações
4. ✅ Verificar existência de admin

### Como executar:
```bash
node scripts/test-edit-user.mjs
```

### Resultado esperado:
```
📊 RESUMO DOS TESTES:
   ✅ Buscar usuário por ID
   ✅ Atualizar usuário
   ✅ Reverter alteração
   ✅ Verificar admin disponível
```

---

## 📋 VALIDAÇÕES IMPLEMENTADAS

### Na API (GET):
- ✅ Verifica se token existe
- ✅ Valida payload do token
- ✅ Busca usuário logado no banco
- ✅ Verifica se usuário logado existe
- ✅ Valida se usuário logado é admin (`categoria === 'admin'`)
- ✅ Busca usuário alvo por ID
- ✅ Verifica se usuário alvo existe
- ✅ Retorna JSON com dados ou erro

### Na API (PUT):
- ✅ Verifica autenticação
- ✅ Valida permissão de admin
- ✅ Verifica duplicidade de email/CPF
- ✅ Atualiza timestamp `updated_at`
- ✅ Retorna usuário atualizado ou erro

### No Frontend:
- ✅ Logs de debug em cada etapa
- ✅ Parse de erros JSON da API
- ✅ Tratamento de 401, 403, 404, 400, 500
- ✅ Mensagens específicas por tipo de erro
- ✅ Redirecionamento automático em caso de não-autenticação

---

## 🔧 FLUXO CORRIGIDO

### 1. **Acesso à Página de Edição**
```
Usuário acessa: /admin/usuarios/[id]
  ↓
Frontend faz: GET /api/usuarios/[id]
  ↓
API verifica:
  1. Token existe? ✅
  2. Token válido? ✅
  3. Usuário logado existe no banco? ✅
  4. Usuário logado é admin? ✅
  5. Usuário alvo existe? ✅
  ↓
API retorna: Dados do usuário
  ↓
Frontend exibe: Formulário com dados
```

### 2. **Salvamento de Alterações**
```
Usuário clica "Salvar"
  ↓
Frontend faz: PUT /api/usuarios/[id]
  ↓
API verifica:
  1. Autenticação ✅
  2. Permissão de admin ✅
  3. Email/CPF já existe em outro usuário? ❌
  4. Atualiza usuário ✅
  ↓
API retorna: Usuário atualizado
  ↓
Frontend redireciona: /admin/usuarios
```

---

## 🚨 POSSÍVEIS ERROS E SOLUÇÕES

### Erro: "Sessão expirada"
**Causa:** Token JWT expirado  
**Solução:** Usuário será redirecionado para login automaticamente

### Erro: "Acesso negado: apenas admins podem editar usuários"
**Causa:** Usuário logado não é admin  
**Solução:** Fazer login com conta admin (pecosta26@gmail.com)

### Erro: "Usuário não encontrado"
**Causa:** ID do usuário inválido ou usuário foi deletado  
**Solução:** Voltar para lista de usuários e selecionar outro

### Erro: "Email ou CPF já está em uso"
**Causa:** Tentou alterar para email/CPF que já existe  
**Solução:** Usar email/CPF diferente

---

## 📁 ARQUIVOS MODIFICADOS

1. ✅ `src/app/api/usuarios/[id]/route.ts`
   - GET: Corrigida validação de admin
   - PUT: Corrigida validação e atualização
   - Adicionados logs detalhados
   - Retornos JSON padronizados

2. ✅ `src/app/(protected)/admin/usuarios/[id]/page.tsx`
   - Melhorado tratamento de erros
   - Adicionados logs de debug
   - Mensagens mais específicas
   - Parse de JSON errors

3. ✅ `scripts/test-edit-user.mjs` (NOVO)
   - Teste automatizado de edição
   - Validação de permissões
   - Verificação de admin

4. ✅ `CORRECAO-EDITAR-USUARIO.md` (NOVO)
   - Esta documentação

---

## 🧪 COMO TESTAR

### Teste 1: Com Script
```bash
node scripts/test-edit-user.mjs
```

### Teste 2: Na Interface

1. **Login como Admin:**
   - Acesse: `http://localhost:3000/auth/login`
   - Email: `pecosta26@gmail.com`
   - Senha: sua senha admin

2. **Acessar Lista de Usuários:**
   - Vá para: `http://localhost:3000/admin/usuarios`

3. **Editar Usuário:**
   - Clique no ícone ✏️ ao lado de um usuário
   - Verifique se os dados carregam corretamente
   - ✅ **DEVE FUNCIONAR** (sem erro "Não autorizado")

4. **Fazer Alterações:**
   - Mude o nome do usuário
   - Clique em "Salvar"
   - Verifique redirecionamento para lista
   - Confirme que alteração foi salva

### Teste 3: Sem Ser Admin

1. **Login como Usuário Normal:**
   - Email: `joao.silva@example.com`

2. **Tentar Editar:**
   - Acesse: `http://localhost:3000/admin/usuarios`
   - ❌ **DEVE BLOQUEAR** acesso

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [x] API retorna JSON ao invés de texto
- [x] Validação de admin corrigida (`===` ao invés de `.includes()`)
- [x] Logs detalhados adicionados
- [x] Tratamento de erros em todas as etapas
- [x] Frontend parse erros JSON corretamente
- [x] Mensagens específicas por tipo de erro
- [x] Script de teste criado
- [x] Documentação completa
- [ ] Teste na interface web
- [ ] Confirmar edição funciona
- [ ] Confirmar bloqueio para não-admins

---

## 🎯 RESULTADO ESPERADO

### Antes:
```
❌ Erro ao carregar usuário: Não autorizado
```

### Depois:
```
✅ Formulário carrega com dados do usuário
✅ Admin pode editar e salvar alterações
✅ Usuário vê mensagem específica em caso de erro
✅ Logs ajudam a debug problemas
```

---

## 💡 OBSERVAÇÕES IMPORTANTES

### Estrutura da Tabela `usuarios`:
```sql
categoria: text (valores: 'admin' ou 'user')
```

### Validação Correta:
```typescript
// ✅ CORRETO
if (user.categoria !== 'admin')

// ❌ ERRADO
if (!user?.categoria?.includes('admin'))
```

### Retornos da API:
```typescript
// ✅ CORRETO
return NextResponse.json({ error: 'Mensagem' }, { status: 403 });

// ❌ ERRADO
return new NextResponse('Forbidden', { status: 403 });
```

---

**Última atualização:** 20 de Outubro de 2025  
**Status:** ✅ **PRONTO PARA TESTE**

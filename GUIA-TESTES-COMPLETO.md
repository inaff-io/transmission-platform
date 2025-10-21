# 🧪 Guia de Testes - Transmission Platform

**Data:** 21 de Outubro de 2025  
**Status:** ✅ Sistema Operacional em Produção

---

## 📋 Usuários Criados para Teste

### 👑 Administrador

**Pedro Costa**
- **ID:** `58700cef-5b1d-4d34-ba89-4f06c9cff006`
- **Email:** `pecosta26@gmail.com`
- **CPF:** `05701807401`
- **Categoria:** `admin`
- **Status:** `ativo`
- **URL:** https://transmission-platform-xi.vercel.app/admin

---

### 👥 Usuários Regulares

#### 1. Maria Silva
- **ID:** `3b6ab2fc-ed9a-4407-bac2-75aa559fca0a`
- **Email:** `maria.silva@test.com`
- **CPF:** `12345678901`
- **Categoria:** `user`
- **Status:** `ativo`

#### 2. João Santos
- **ID:** `6ec3a15e-e038-4490-b07c-3750e65ad713`
- **Email:** `joao.santos@test.com`
- **CPF:** `98765432109`
- **Categoria:** `user`
- **Status:** `ativo`

#### 3. Ana Oliveira
- **ID:** `f9a2de26-33d5-4e99-8ba2-3c28255b4f27`
- **Email:** `ana.oliveira@test.com`
- **CPF:** `45678912301`
- **Categoria:** `user`
- **Status:** `ativo`

**URL Login User:** https://transmission-platform-xi.vercel.app/login

---

## 🧪 Roteiro de Testes

### 1️⃣ Teste de Login Admin

**Objetivo:** Validar autenticação passwordless do administrador

**Passos:**
1. Acesse: https://transmission-platform-xi.vercel.app/admin
2. **Teste A - Login por Email:**
   - Digite: `pecosta26@gmail.com`
   - Clique em "Entrar"
   - ✅ **Esperado:** Login bem-sucedido, redirecionamento para painel admin

3. **Teste B - Login por CPF:**
   - Digite: `05701807401`
   - Clique em "Entrar"
   - ✅ **Esperado:** Login bem-sucedido, redirecionamento para painel admin

**Validações:**
- [ ] Login por email funcionando
- [ ] Login por CPF funcionando
- [ ] Sem prompt de senha (passwordless)
- [ ] Rate limiting não bloqueia (100 tentativas/min)
- [ ] Redirecionamento correto após login
- [ ] Acesso ao painel administrativo concedido

---

### 2️⃣ Teste de Login Usuário Regular

**Objetivo:** Validar autenticação de usuários regulares

**Passos:**
1. Acesse: https://transmission-platform-xi.vercel.app/login

2. **Teste com Maria Silva:**
   - Email: `maria.silva@test.com` OU CPF: `12345678901`
   - ✅ **Esperado:** Login bem-sucedido

3. **Teste com João Santos:**
   - Email: `joao.santos@test.com` OU CPF: `98765432109`
   - ✅ **Esperado:** Login bem-sucedido

4. **Teste com Ana Oliveira:**
   - Email: `ana.oliveira@test.com` OU CPF: `45678912301`
   - ✅ **Esperado:** Login bem-sucedido

**Validações:**
- [ ] Login de múltiplos usuários funciona
- [ ] Sistema aceita email OU CPF
- [ ] Não há prompt de senha
- [ ] Redirecionamento para área do usuário

---

### 3️⃣ Teste de Acesso ao Painel Admin

**Objetivo:** Verificar funcionalidades administrativas

**Passos:**
1. Faça login como admin (pecosta26@gmail.com)
2. Verifique as seguintes funcionalidades:

**Validações:**
- [ ] Dashboard carrega corretamente
- [ ] Menu de navegação visível
- [ ] Seção "Usuários" acessível
- [ ] Opção "Importar Excel" presente
- [ ] Listagem de usuários funciona
- [ ] Dados dos 4 usuários aparecem corretamente

---

### 4️⃣ Teste de Importação Excel

**Objetivo:** Validar importação de usuários via Excel com geração automática de IDs

**Preparação:**
Crie um arquivo Excel com as seguintes colunas:
- `nome` (obrigatório)
- `email` (obrigatório)
- `cpf` (obrigatório)
- `categoria` (opcional: "user" ou "admin")

**Exemplo de dados:**
```
Nome           | Email                    | CPF           | Categoria
Carlos Lima    | carlos.lima@test.com     | 11122233344   | user
Fernanda Rocha | fernanda.rocha@test.com  | 55566677788   | user
```

**Passos:**
1. Acesse painel admin
2. Navegue: **Usuários → Importar Excel**
3. Selecione o arquivo Excel preparado
4. Clique em "Importar"

**Validações:**
- [ ] Upload do arquivo bem-sucedido
- [ ] IDs gerados automaticamente (UUIDs)
- [ ] Nenhum conflito de ID
- [ ] Emails únicos validados
- [ ] CPFs únicos validados
- [ ] Novos usuários aparecem na listagem
- [ ] Dados importados corretamente

**Verificação no Banco:**
```bash
node scripts/check-users-simple.mjs
```
- [ ] Contagem de usuários aumentou
- [ ] Novos usuários têm UUIDs válidos
- [ ] Todos os campos preenchidos corretamente

---

### 5️⃣ Teste de Links Ativos

**Objetivo:** Validar carregamento de transmissão e programação

**Passos:**
1. Acesse a página inicial: https://transmission-platform-xi.vercel.app
2. Verifique os iframes de vídeo

**Validações:**
- [ ] Iframe de transmissão (YouTube) carrega
- [ ] Iframe de programação (iWeventos) carrega
- [ ] Vídeos são reproduzidos corretamente
- [ ] Layout responsivo funciona
- [ ] Nenhum erro de CORS

**Verificação da API:**
```bash
curl https://transmission-platform-xi.vercel.app/api/links/active
```
- [ ] Retorna HTTP 200 OK
- [ ] JSON com 2 links (transmissão + programação)

---

### 6️⃣ Teste de Chat (Opcional)

**Objetivo:** Validar funcionalidade de chat

**Passos:**
1. Faça login com qualquer usuário
2. Acesse a área de chat
3. Envie mensagens de teste

**Validações:**
- [ ] Mensagens salvam no banco
- [ ] Limite de 500 caracteres funciona
- [ ] Mensagens aparecem em tempo real
- [ ] Rate limiting apropriado

---

## 📊 Resumo de Validações

### ✅ Sistema Operacional
- [x] IPv6 resolvido (Session Pooler)
- [x] API respondendo HTTP/2 200 OK
- [x] PostgreSQL conectado via IPv4
- [x] Build: 32s, Deploy: 97s
- [x] Rate limiting: 100/min (login), 50/5min (registro)

### 🔄 Aguardando Testes
- [ ] Login admin por email
- [ ] Login admin por CPF
- [ ] Login usuários regulares
- [ ] Acesso ao painel administrativo
- [ ] Importação Excel com UUID automático
- [ ] Validação de links ativos
- [ ] Chat (se aplicável)

---

## 🐛 Relatório de Problemas

**Se encontrar algum erro, documente:**

1. **Tipo de erro:** (Login, Importação, API, etc.)
2. **Mensagem de erro:** (Captura ou texto completo)
3. **Passos para reproduzir:**
4. **Credenciais usadas:**
5. **Navegador/Dispositivo:**

**Logs úteis:**
```bash
# Verificar logs do Vercel
vercel logs --follow

# Testar conexão local
node scripts/test-db-connection.mjs

# Listar usuários
node scripts/check-users-simple.mjs
```

---

## 📝 Observações Importantes

### Sistema Passwordless
- ✅ **Não há campo de senha**
- ✅ Login funciona com email **OU** CPF
- ✅ Validação case-insensitive para email
- ✅ CPF pode ter pontuação (sistema remove automaticamente)

### Rate Limiting
- ✅ Login: 100 tentativas/minuto
- ✅ Registro: 50 tentativas/5 minutos
- ✅ Não deve bloquear testes normais

### Geração de IDs
- ✅ Banco gera UUIDs automaticamente
- ✅ Não é necessário fornecer ID no Excel
- ✅ Sistema garante unicidade

### Banco de Dados
- ✅ PostgreSQL 17.6
- ✅ 14 tabelas ativas
- ✅ Conexão via Session Pooler (IPv4)
- ✅ Região: aws-1-us-east-2 (Ohio)

---

## 🚀 Próximos Passos Após Testes

1. **Se tudo funcionar:**
   - Limpar usuários de teste (opcional)
   - Começar a usar em produção
   - Monitorar logs inicialmente

2. **Se houver problemas:**
   - Documentar erros encontrados
   - Executar scripts de diagnóstico
   - Ajustar configurações conforme necessário

3. **Melhorias futuras:**
   - Migrar de Supabase para PostgreSQL direto
   - Otimizar rate limiting baseado em uso real
   - Implementar mais funcionalidades admin

---

**Última atualização:** 21/10/2025 00:50  
**Versão:** 1.0  
**Status:** ✅ Pronto para testes

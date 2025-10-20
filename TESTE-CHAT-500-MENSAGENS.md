# 💬 Teste de Carga: Chat com 500 Mensagens

**Data:** 20/10/2025  
**Scripts:** `scripts/test-chat-500-messages.mjs`, `scripts/create-test-chat-user.mjs`

---

## 🎯 Objetivo

Testar o sistema de chat enviando **500 mensagens** com intervalo de **10 segundos** entre cada mensagem, simulando um usuário normal (não admin) usando o chat durante a transmissão.

---

## ⚙️ Configurações do Teste

```javascript
Total de mensagens: 500
Intervalo: 10 segundos (10000ms)
Usuário: Normal (categoria: 'user')
Tempo estimado: ~83 minutos (1h 23min)
```

### Cálculo do Tempo:
```
500 mensagens × 10 segundos = 5.000 segundos
5.000 segundos ÷ 60 = 83,33 minutos
83 minutos = 1 hora e 23 minutos
```

---

## 👤 Usuário de Teste

```javascript
{
  id: 'usuario_teste_chat',
  nome: 'Usuário Teste Chat',
  email: 'usuario.teste@example.com',
  cpf: '12345678901',
  senha: 'senha123',
  categoria: 'user',
  status: true,
  ativo: true
}
```

---

## 📝 Passo a Passo

### 1️⃣ **Criar Usuário de Teste**

Primeiro, crie o usuário que será usado no teste:

```bash
node scripts/create-test-chat-user.mjs
```

**Saída esperada:**
```
🔧 Criando usuário de teste para chat...

✅ Usuário criado com sucesso!

📋 Dados do usuário:
   ID: usuario_teste_chat
   Nome: Usuário Teste Chat
   Email: usuario.teste@example.com
   CPF: 12345678901
   Senha: senha123
   Categoria: user
   Status: true
   Ativo: true

✨ Pronto para usar nos testes de chat!
```

**Se o usuário já existir:**
```
ℹ️  Usuário já existe:
   ID: usuario_teste_chat
   Nome: Usuário Teste Chat
   Email: usuario.teste@example.com

✅ Você pode usar este usuário para os testes!
```

---

### 2️⃣ **Garantir que o Servidor está Rodando**

```bash
# Se não estiver rodando:
npm run dev

# Verifique se está acessível:
# http://localhost:3000
```

---

### 3️⃣ **Executar o Teste de Chat**

```bash
node scripts/test-chat-500-messages.mjs
```

**Saída inicial:**
```
╔════════════════════════════════════════════════╗
║   TESTE DE CARGA: CHAT COM 500 MENSAGENS      ║
╚════════════════════════════════════════════════╝

⚙️  Configurações:
   Total de mensagens: 500
   Intervalo: 10 segundos
   Tempo estimado: ~83 minutos
   URL base: http://localhost:3000

🔐 Fazendo login...
   Email: usuario.teste@example.com

✅ Login realizado com sucesso!
   Usuário: Usuário Teste Chat
   Categoria: user
   Token: eyJhbGciOiJIUzI1NiIs...

📤 Iniciando envio de mensagens...
   (Pressione Ctrl+C para cancelar)
```

---

### 4️⃣ **Acompanhar o Progresso**

O script mostra o progresso a cada 10 mensagens:

```
📊 Progresso: [████████░░░░░░░░░░░░░░░░░░░░] 26.0%
   Enviadas: 130/500
   Sucesso: 130
   Falhas: 0
   Tempo decorrido: 21m 40s
   Tempo estimado restante: 61m 40s
```

**Barra de progresso:**
```
[████████████████████████████████] 100%  ← Completo
[████████████████░░░░░░░░░░░░░░░░]  50%  ← Metade
[████░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  10%  ← Início
```

---

### 5️⃣ **Relatório Final**

Quando o teste terminar:

```
╔════════════════════════════════════════════════╗
║            TESTE CONCLUÍDO                     ║
╚════════════════════════════════════════════════╝

📊 Estatísticas Finais:
   Total de mensagens: 500
   Enviadas com sucesso: 500
   Falhas: 0
   Taxa de sucesso: 100.0%
   Tempo total: 1h 23m 20s
   Primeira mensagem: 20/10/2025 10:30:15
   Última mensagem: 20/10/2025 11:53:35

🎉 Teste concluído com 100% de sucesso!

✨ Teste finalizado!
```

---

## 📊 Formato das Mensagens

Cada mensagem enviada tem o seguinte formato:

```
Teste de carga - Mensagem #1 de 500
Teste de carga - Mensagem #2 de 500
Teste de carga - Mensagem #3 de 500
...
Teste de carga - Mensagem #500 de 500
```

**Características:**
- Identifica o número da mensagem
- Mostra o total de mensagens
- Fácil de identificar no chat
- Tamanho consistente (~45 caracteres)

---

## 🔍 Métricas Monitoradas

### 1. **Taxa de Sucesso**
```
✅ 100%:     Perfeito!
✅ 95-99%:   Excelente
⚠️  80-94%:   Bom (alguns erros)
❌ < 80%:    Problemas detectados
```

### 2. **Tempo de Resposta**
- Cada mensagem deve ser enviada e confirmada
- O script aguarda 10s entre mensagens
- Tempo total teórico: 83 minutos

### 3. **Erros**
O script detecta e registra:
- Erros de autenticação (401)
- Erros de validação (400)
- Erros do servidor (500)
- Erros de conexão

### 4. **Estatísticas em Tempo Real**
- Total de mensagens enviadas
- Sucesso vs Falhas
- Tempo decorrido
- Tempo estimado restante (ETA)
- Últimos erros (se houver)

---

## ⚠️ Interrompendo o Teste

Pressione **Ctrl+C** para interromper o teste a qualquer momento:

```
⚠️  Teste interrompido pelo usuário!
   Mensagens enviadas: 247/500
   Sucesso: 247
   Falhas: 0
   Tempo decorrido: 41m 10s

👋 Até logo!
```

---

## 🧪 Cenários de Teste

### ✅ Cenário 1: Teste Completo (500 mensagens)
```bash
# Deixa rodar até o final (~83 minutos)
node scripts/test-chat-500-messages.mjs
```

**Objetivo:** Testar capacidade total do sistema

---

### 🔄 Cenário 2: Teste Parcial (100 mensagens)
```bash
# Edite o script temporariamente:
const TOTAL_MESSAGES = 100; // Era 500

# Execute:
node scripts/test-chat-500-messages.mjs

# Tempo estimado: ~16 minutos
```

**Objetivo:** Teste rápido de validação

---

### ⚡ Cenário 3: Teste Rápido (50 mensagens, 5s intervalo)
```bash
# Edite o script temporariamente:
const TOTAL_MESSAGES = 50;
const INTERVAL_MS = 5000; // 5 segundos

# Execute:
node scripts/test-chat-500-messages.mjs

# Tempo estimado: ~4 minutos
```

**Objetivo:** Teste express de funcionalidade

---

## 📈 O Que o Teste Valida

### 1. **Autenticação**
✅ Login com usuário normal  
✅ Token JWT válido  
✅ Cookie authToken funcional

### 2. **API de Chat**
✅ POST /api/chat/messages  
✅ Validação de mensagem  
✅ Limite de 500 caracteres  
✅ Retorno correto (201)

### 3. **Banco de Dados**
✅ Inserção de mensagens  
✅ ID automático (UUID)  
✅ Timestamps corretos  
✅ Relacionamento com usuário

### 4. **Performance**
✅ Resposta rápida (< 1s)  
✅ Sem travamentos  
✅ Sem vazamento de memória  
✅ Conexões estáveis

### 5. **Escalabilidade**
✅ Suporta 500+ mensagens  
✅ Mantém taxa de sucesso alta  
✅ Recupera de erros temporários

---

## 🛠️ Troubleshooting

### Problema: "Login falhou: 401"
```
❌ Erro ao fazer login: Login falhou: 401 - Credenciais inválidas
```

**Solução:**
```bash
# Recrie o usuário de teste:
node scripts/create-test-chat-user.mjs

# Ou verifique se o usuário existe no Supabase:
# https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/editor
```

---

### Problema: "ECONNREFUSED"
```
❌ Erro ao enviar mensagem #1: connect ECONNREFUSED 127.0.0.1:3000
```

**Solução:**
```bash
# O servidor não está rodando. Inicie-o:
npm run dev

# Aguarde a mensagem:
# ✓ Ready in 2.5s
# ○ Local: http://localhost:3000
```

---

### Problema: "Muitos erros consecutivos"
```
⚠️  Muitos erros consecutivos detectados!
   Verifique se o servidor está rodando e se as credenciais estão corretas.
```

**Solução:**
1. Verifique se o servidor está rodando
2. Verifique se o usuário existe
3. Verifique os logs do servidor (terminal do `npm run dev`)
4. Verifique se o Supabase está acessível

---

### Problema: "Mensagem muito longa"
```
❌ Erro ao enviar mensagem #42: 400 - Mensagem muito longa (max 500)
```

**Solução:**
O script já usa mensagens curtas (~45 chars), mas se modificou:
```javascript
// Verifique o tamanho da mensagem:
const message = `Teste de carga - Mensagem #${messageNumber} de ${TOTAL_MESSAGES}`;
console.log(message.length); // Deve ser < 500
```

---

## 📊 Tabela de Tempos Estimados

| Mensagens | Intervalo | Tempo Total | Uso Recomendado |
|-----------|-----------|-------------|-----------------|
| 50 | 5s | ~4 min | Teste rápido |
| 100 | 10s | ~17 min | Validação |
| 200 | 10s | ~33 min | Teste médio |
| 500 | 10s | ~83 min | Teste completo |
| 1000 | 10s | ~167 min | Stress test |

---

## 🎯 Critérios de Sucesso

### ✅ Teste Aprovado:
- Taxa de sucesso ≥ 95%
- Tempo de resposta < 2s por mensagem
- Sem erros de servidor (500)
- Sem travamentos

### ⚠️ Teste com Ressalvas:
- Taxa de sucesso 80-94%
- Alguns erros temporários
- Performance aceitável

### ❌ Teste Reprovado:
- Taxa de sucesso < 80%
- Muitos erros de servidor
- Timeout frequentes
- Sistema travou

---

## 📝 Arquivos do Teste

### 1. `scripts/test-chat-500-messages.mjs`
**Tamanho:** ~15KB  
**Funções:**
- `login()` - Autentica usuário
- `sendMessage()` - Envia mensagem
- `showProgress()` - Exibe progresso
- `formatElapsedTime()` - Formata tempo
- `formatETA()` - Calcula tempo restante
- `main()` - Função principal

### 2. `scripts/create-test-chat-user.mjs`
**Tamanho:** ~3KB  
**Funções:**
- `main()` - Cria usuário de teste
- Verifica se usuário já existe
- Cria no Supabase com dados padrão

---

## 🔍 Logs Gerados

### Durante o Teste:
```
✅ Mensagem #1 enviada com sucesso
✅ Mensagem #2 enviada com sucesso
...

📊 Progresso: [████░░░░...] 15.0%
   Enviadas: 75/500
   Sucesso: 75
   Falhas: 0
   Tempo decorrido: 12m 30s
   Tempo estimado restante: 70m 50s
```

### Ao Final:
```
📊 Estatísticas Finais:
   Total de mensagens: 500
   Enviadas com sucesso: 495
   Falhas: 5
   Taxa de sucesso: 99.0%
   Tempo total: 1h 23m 45s
   ...
```

---

## 🎨 Visualizando no Chat Real

Enquanto o teste roda, você pode:

1. Abrir outra aba do navegador
2. Fazer login como admin ou outro usuário
3. Acessar a página do chat
4. Ver as mensagens chegando em tempo real!

```
Teste de carga - Mensagem #145 de 500
Teste de carga - Mensagem #146 de 500
Teste de carga - Mensagem #147 de 500
...
```

---

## 💡 Dicas

### 1. **Execute em Terminal Separado**
```bash
# Terminal 1: Servidor
npm run dev

# Terminal 2: Teste de chat
node scripts/test-chat-500-messages.mjs
```

### 2. **Monitore os Logs do Servidor**
Observe o terminal do servidor para ver:
- Requisições recebidas
- Erros (se houver)
- Performance

### 3. **Use um Usuário Específico**
Não use um usuário admin ou importante:
- O teste cria MUITAS mensagens
- Pode poluir o banco de dados
- Use sempre o usuário de teste

### 4. **Limpe o Chat Depois**
```bash
# Após o teste, você pode limpar o chat via API (como admin):
curl -X DELETE http://localhost:3000/api/chat/messages \
  -H "Cookie: authToken=SEU_TOKEN_ADMIN"
```

---

## 🚀 Próximos Passos

Após executar o teste com sucesso:

1. ✅ Analisar estatísticas finais
2. ✅ Verificar taxa de sucesso (>95%)
3. ✅ Conferir tempo total (~83 minutos)
4. ✅ Limpar mensagens de teste do banco
5. ✅ Documentar resultados
6. ✅ Testar com múltiplos usuários simultâneos (opcional)

---

## 📚 Comandos Rápidos

```bash
# 1. Criar usuário de teste
node scripts/create-test-chat-user.mjs

# 2. Iniciar servidor (se não estiver rodando)
npm run dev

# 3. Executar teste completo (500 mensagens)
node scripts/test-chat-500-messages.mjs

# 4. Interromper teste
# Pressione Ctrl+C

# 5. Ver mensagens no banco (Supabase)
# https://supabase.com/dashboard/project/ywcmqgfbxrejuwcbeolu/editor
# Selecione a tabela 'chat'
```

---

## ✅ Checklist

Antes de executar o teste:

- [ ] Servidor Next.js rodando (`npm run dev`)
- [ ] Usuário de teste criado (`node scripts/create-test-chat-user.mjs`)
- [ ] Supabase acessível
- [ ] Terminal livre para rodar o teste
- [ ] ~83 minutos disponíveis (ou modifique TOTAL_MESSAGES)

---

## 🎉 Status

**Script criado e pronto para uso!**

Execute:
```bash
node scripts/create-test-chat-user.mjs
node scripts/test-chat-500-messages.mjs
```

E acompanhe as **500 mensagens** sendo enviadas a cada **10 segundos**! 💬🚀

---

**Criado em:** 20/10/2025  
**Tempo estimado do teste:** 1 hora e 23 minutos  
**Total de mensagens:** 500  
**Intervalo:** 10 segundos

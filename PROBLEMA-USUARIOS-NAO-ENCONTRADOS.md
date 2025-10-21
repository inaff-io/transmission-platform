# ❌ PROBLEMA: Usuários Não Encontrados em Produção

**Data:** 21 de Outubro de 2025, 22:11  
**Status:** 🔴 Todos os logins falharam (0/5)

---

## 🔍 Diagnóstico

### Erro Retornado:
```json
{
  "error": "Usuário não encontrado",
  "message": "Verifique se você digitou o e-mail ou CPF corretamente"
}
```

### Testes Realizados:
- ❌ Admin (Email): pecosta26@gmail.com → **404 Not Found**
- ❌ Admin (CPF): 05701807401 → **404 Not Found**
- ❌ User 1: maria.silva@test.com → **404 Not Found**
- ❌ User 2: joao.santos@test.com → **404 Not Found**
- ❌ User 3: ana.oliveira@test.com → **404 Not Found**

---

## 🎯 Causa Raiz

### Bancos de Dados Diferentes:

**LOCAL (onde criamos os usuários):**
- Host: `aws-1-us-east-2.pooler.supabase.com` (US-East-2)
- Porta: 5432 (Session pooler)
- Projeto: ywcmqgfbxrejuwcbeolu
- Usuários: ✅ 4 usuários criados (Pedro + 3 test)

**PRODUÇÃO (config.ts atual):**
- Host: `aws-1-sa-east-1.pooler.supabase.com` (SA-East-1)
- Porta: 6543 (Transaction pooler)
- Projeto: ywcmqgfbxrejuwcbeolu
- Usuários: ❌ 0 usuários (banco vazio ou diferente)

### Problema:
**REGIÕES DIFERENTES = BANCOS DIFERENTES!**

Embora seja o mesmo projeto Supabase (ywcmqgfbxrejuwcbeolu), as regiões US-East-2 e SA-East-1 podem ter **réplicas diferentes** ou **configurações de pooler diferentes**.

---

## 🔧 Soluções Possíveis

### Opção 1: Voltar para US-East-2 (Recomendado)
**Vantagem:** Usuários já existem nesse banco  
**Desvantagem:** Latência maior (150-200ms)

```typescript
export const dbConfig = {
  user: 'postgres.ywcmqgfbxrejuwcbeolu',
  password: 'OMSmx9QqbMq4OXun',
  host: 'aws-1-us-east-2.pooler.supabase.com',  // Voltar US-East-2
  port: 5432,  // Session pooler
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
};
```

### Opção 2: Recriar Usuários em SA-East-1
**Vantagem:** Latência melhor (10-30ms)  
**Desvantagem:** Precisa criar usuários novamente

```bash
# Atualizar scripts para usar SA-East-1
# Executar novamente:
node scripts/create-pedro-admin.mjs
node scripts/create-test-users.mjs
```

### Opção 3: Usar DIRECT_URL (Recomendado Originalmente)
**Vantagem:** Usa variável de ambiente do Vercel  
**Desvantagem:** Precisa verificar qual DIRECT_URL está configurado

```typescript
export const dbConfig = {
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
};
```

---

## 🎯 Recomendação

### SOLUÇÃO IMEDIATA: Voltar para US-East-2

**Por quê?**
1. ✅ Usuários já criados e validados
2. ✅ Sabemos que funciona (testes locais OK)
3. ✅ Menos mudanças necessárias
4. ⚠️ Latência aceitável (~200ms)

**Como fazer:**
1. Atualizar `config.ts` para US-East-2, porta 5432
2. Commit e push
3. Aguardar redeploy
4. Testar novamente

### SOLUÇÃO IDEAL: Verificar DIRECT_URL no Vercel

**Por quê?**
1. ✅ Usa configuração do Vercel
2. ✅ Mais flexível (troca por env var)
3. ✅ Segue a correção original DATABASE_URL → DIRECT_URL

**Como fazer:**
1. Verificar qual URL está em `process.env.DIRECT_URL` no Vercel
2. Se for US-East-2: perfeito, funciona
3. Se for SA-East-1: precisa criar usuários lá

---

## 📊 Comparação

| Aspecto | US-East-2 | SA-East-1 | DIRECT_URL |
|---------|-----------|-----------|------------|
| Usuários existem | ✅ Sim | ❌ Não | ❓ Depende |
| Latência (BR) | ⚠️ 150-200ms | ✅ 10-30ms | ❓ Depende |
| Segurança | ⚠️ Hardcoded | ⚠️ Hardcoded | ✅ Env var |
| Pronto para usar | ✅ Sim | ❌ Não | ❓ Precisa verificar |

---

## ⏭️ Próxima Ação

**DECISÃO NECESSÁRIA:**

1. **Voltar US-East-2?** (rápido, funciona agora)
2. **Criar usuários SA-East-1?** (melhor latência, mais trabalho)
3. **Verificar DIRECT_URL?** (mais flexível, precisa confirmar)

**Aguardando decisão do usuário...**

---

## 🔍 Debug Info

### Script de Teste:
- Criado: `scripts/test-production-login.mjs`
- Testou: Admin (email+CPF) + 3 users
- Resultado: 0/5 passou

### Config Atual (Produção):
```typescript
host: 'aws-1-sa-east-1.pooler.supabase.com'
port: 6543
```

### Config Local (Funcionando):
```typescript
host: 'aws-1-us-east-2.pooler.supabase.com'
port: 5432
```

### Conclusão:
**Produção e Local apontam para regiões/portas diferentes!**

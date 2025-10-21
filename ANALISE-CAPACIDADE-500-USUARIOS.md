# 📊 Análise de Capacidade: 500 Usuários Online

**Data:** 21 de Outubro de 2025  
**Objetivo:** Avaliar se o sistema aguenta 500 pessoas online simultaneamente

---

## 🔍 Arquitetura Atual

### Frontend:
- **Next.js 14** (App Router)
- **Vercel Hosting** (Serverless)
- **Static + SSR Pages**

### Backend:
- **Next.js API Routes** (Serverless Functions)
- **Vercel Edge Network**
- **PostgreSQL (Supabase)**

### Database:
- **PostgreSQL 17.6**
- **Supabase Pooler** (Session Mode)
- **Região:** US-East-2 (Ohio)
- **Porta:** 5432

---

## 📈 Capacidade Estimada por Componente

### 1. Vercel (Frontend + API)

**Plano Free:**
- ✅ Banda: 100GB/mês
- ✅ Invocações: 1 milhão/mês
- ✅ Execução: 100 horas/mês
- ⚠️ Concorrência: ~10 execuções simultâneas

**Plano Pro (~$20/mês):**
- ✅ Banda: 1TB/mês
- ✅ Invocações: Ilimitadas
- ✅ Execução: 1000 horas/mês
- ✅ Concorrência: ~100 execuções simultâneas

**Plano Enterprise:**
- ✅ Banda: Ilimitada
- ✅ Invocações: Ilimitadas
- ✅ Concorrência: ~1000+ execuções

**Para 500 usuários:**
- 📊 Necessário: **Plano Pro mínimo**
- 🎯 Recomendado: **Plano Enterprise**

---

### 2. Supabase (PostgreSQL)

**Plano Free (Atual):**
- ✅ Database: 500MB
- ✅ Banda: 5GB/mês
- ⚠️ **Conexões: 60 simultâneas** (LIMITADOR!)
- ⚠️ Pooler: Session mode (1 conexão = 1 cliente)

**Plano Pro (~$25/mês):**
- ✅ Database: 8GB
- ✅ Banda: 250GB/mês
- ✅ **Conexões: 200 simultâneas**
- ✅ Connection pooling melhorado

**Plano Team (~$599/mês):**
- ✅ Database: 100GB+
- ✅ Banda: Ilimitada
- ✅ **Conexões: 400+ simultâneas**
- ✅ Read replicas disponíveis

**Para 500 usuários:**
- 📊 Plano Free: ❌ **INSUFICIENTE** (máx 60 conexões)
- 🎯 Plano Pro: ⚠️ **LIMITE** (200 conexões, pode travar)
- ✅ Plano Team: ✅ **RECOMENDADO** (400+ conexões)

---

## ⚠️ GARGALOS IDENTIFICADOS

### 🔴 CRÍTICO: Connection Pool (Plano Free)

**Problema:**
```
Supabase Free: 60 conexões simultâneas
500 usuários online = 500 conexões potenciais
60 < 500 ❌ INSUFICIENTE!
```

**O que acontece:**
1. Usuário 1-60: ✅ Login OK
2. Usuário 61+: ❌ "Too many connections"
3. Sistema: 🔴 Travamento parcial
4. Experiência: 😡 Usuários não conseguem acessar

**Solução:**
- ✅ Upgrade Supabase para Pro (200 conexões) ou Team (400+)
- ✅ Implementar Connection Pooling adequado
- ✅ Usar Transaction Mode no pooler (libera conexões mais rápido)

---

### 🟡 MODERADO: Vercel Serverless (Plano Free)

**Problema:**
```
Vercel Free: ~10 execuções simultâneas
500 usuários = ~50-100 requests/segundo no pico
10 < 100 ❌ INSUFICIENTE!
```

**O que acontece:**
1. Request 1-10: ✅ Processado
2. Request 11+: ⏳ Fila de espera (latência alta)
3. Timeout: 🔴 Alguns requests podem falhar (>10s)

**Solução:**
- ✅ Upgrade Vercel para Pro ($20/mês)
- ✅ Ou Enterprise para alta demanda

---

## 📊 Cenários de Uso

### Cenário 1: 500 Usuários Navegando (Leitura)

**Carga:**
- Páginas estáticas: ✅ Suporta (cache CDN)
- API de leitura: ⚠️ Depende do pooler
- Transmissão ao vivo: ✅ OK (se usar iframe/embed externo)

**Conexões DB necessárias:**
- ~50-100 simultâneas (usuários ativos fazendo requests)

**Veredicto:**
- Plano Free: ❌ **NÃO AGUENTA**
- Plano Pro (ambos): ✅ **AGUENTA BEM**

---

### Cenário 2: 500 Usuários Fazendo Login Simultaneamente

**Carga:**
- 500 requests de login ao mesmo tempo
- Cada login = 1 query no banco
- Duração: ~100-300ms por login

**Conexões DB necessárias:**
- Pico: 500 conexões simultâneas (se todos juntos)
- Realista: ~100-200 (escalonado em 10-30 segundos)

**Veredicto:**
- Plano Free: 🔴 **TRAVA TOTALMENTE** (máx 60)
- Plano Pro: ⚠️ **LIMITE CRÍTICO** (máx 200)
- Plano Team: ✅ **AGUENTA** (400+)

---

### Cenário 3: 500 Usuários Assistindo Transmissão

**Carga:**
- Vídeo servido por: YouTube/Vimeo (externo) ✅
- API carrega dados: Ocasionalmente
- Conexões DB: Mínimas (~10-20)

**Veredicto:**
- Plano Free: ✅ **AGUENTA** (se vídeo for externo)
- Plano Pro: ✅ **AGUENTA MUITO BEM**

---

## 💰 Custos para Suportar 500 Usuários

### Opção 1: Planos Free (NÃO RECOMENDADO)
**Custo:** $0/mês  
**Capacidade:** ❌ 60 conexões (máx 60 usuários simultâneos)  
**Status:** 🔴 **INSUFICIENTE**

### Opção 2: Planos Pro
**Custo:** ~$45/mês ($20 Vercel + $25 Supabase)  
**Capacidade:** ⚠️ 200 conexões (funciona, mas no limite)  
**Status:** 🟡 **FUNCIONA COM OTIMIZAÇÕES**

### Opção 3: Planos Premium
**Custo:** ~$619/mês ($20 Vercel Pro + $599 Supabase Team)  
**Capacidade:** ✅ 400+ conexões (folga para crescimento)  
**Status:** ✅ **RECOMENDADO PARA 500 USUÁRIOS**

### Opção 4: Enterprise
**Custo:** ~$1000-2000/mês (custom pricing)  
**Capacidade:** ✅ 1000+ conexões (escalável)  
**Status:** 🚀 **IDEAL PARA CRESCIMENTO**

---

## 🔧 Otimizações Necessárias

### 1. Connection Pooling Inteligente

**Implementar PgBouncer ou similar:**
```javascript
// Em vez de 1 conexão por request:
export const dbPool = new Pool({
  connectionString: process.env.DIRECT_URL,
  max: 20,  // Máximo de conexões no pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

**Benefício:**
- Reduz conexões de 500 → ~20-50
- Reutiliza conexões
- Libera mais rápido

---

### 2. Caching de Dados

**Implementar Redis ou Cache em Memória:**
```javascript
// Cache de usuários frequentes
const userCache = new Map();

export async function getCachedUser(id) {
  if (userCache.has(id)) {
    return userCache.get(id);  // Não acessa DB
  }
  
  const user = await db.query('SELECT * FROM usuarios WHERE id = $1', [id]);
  userCache.set(id, user);
  return user;
}
```

**Benefício:**
- Reduz queries ao banco em ~70-80%
- Menos conexões necessárias
- Response time mais rápido

---

### 3. Transaction Mode Pooler

**Mudar de Session → Transaction:**
```typescript
// config.ts
export const dbConfig = {
  host: 'aws-1-us-east-2.pooler.supabase.com',
  port: 6543,  // Transaction mode (em vez de 5432)
  // ...
};
```

**Benefício:**
- Libera conexões imediatamente após query
- Suporta mais usuários simultâneos
- Menos conexões ociosas

---

### 4. Rate Limiting Inteligente

**Implementar limites por IP/User:**
```javascript
const rateLimiter = {
  windowMs: 60000,  // 1 minuto
  max: 30,  // Máx 30 requests/min por IP
};
```

**Benefício:**
- Previne sobrecarga
- Protege contra ataques
- Distribui carga uniformemente

---

### 5. CDN para Assets Estáticos

**Usar Vercel Edge Network:**
- Imagens: Servidas por CDN
- CSS/JS: Cached globalmente
- HTML estático: Edge rendering

**Benefício:**
- Reduz carga no servidor
- Latência menor para usuários
- Mais recursos para API/DB

---

## 📈 Plano de Escalabilidade

### Fase 1: 0-50 Usuários (Atual)
- ✅ Plano Free funciona
- ✅ 60 conexões suficientes
- Custo: $0/mês

### Fase 2: 50-200 Usuários
- ⚠️ Implementar connection pooling
- 🎯 Upgrade para Pro
- Custo: ~$45/mês

### Fase 3: 200-500 Usuários
- ✅ Supabase Team + Vercel Pro
- ✅ Implementar caching (Redis)
- ✅ Transaction mode pooler
- Custo: ~$650/mês

### Fase 4: 500-1000 Usuários
- 🚀 Considerar Supabase Enterprise
- 🚀 Read replicas
- 🚀 Load balancing
- Custo: ~$1500-2000/mês

### Fase 5: 1000+ Usuários
- 🌐 Múltiplas regiões
- 🌐 CDN global
- 🌐 Auto-scaling
- Custo: Custom pricing

---

## ✅ RESPOSTA FINAL

### 500 Usuários Online Simultaneamente:

**Com Plano FREE (atual):**
❌ **NÃO AGUENTA**
- Máximo real: ~60 usuários simultâneos
- Acima disso: Erro "Too many connections"

**Com Planos PRO (~$45/mês):**
⚠️ **AGUENTA COM OTIMIZAÇÕES**
- Necessário: Connection pooling + cache
- Máximo: ~150-250 usuários (depende do uso)
- Requer monitoramento constante

**Com Planos TEAM (~$650/mês):**
✅ **AGUENTA BEM**
- 400+ conexões disponíveis
- Folga para picos
- Crescimento até ~800 usuários

**Com ENTERPRISE (~$1500+/mês):**
🚀 **AGUENTA COM FOLGA**
- 1000+ conexões
- Auto-scaling
- SLA garantido

---

## 🎯 Recomendação

Para **500 usuários online simultaneamente**:

### Mínimo Necessário:
1. **Vercel Pro:** $20/mês
2. **Supabase Team:** $599/mês
3. **Total:** ~$620/mês

### Com Otimizações (Alternativa):
1. **Vercel Pro:** $20/mês
2. **Supabase Pro:** $25/mês
3. **Connection Pooling:** Implementado
4. **Caching (Redis):** $15-30/mês
5. **Total:** ~$60-75/mês
6. **Capacidade:** ~200-300 usuários simultâneos

### Conclusão:
- 🔴 **Plano atual (Free):** Máx 60 usuários ❌
- 🟡 **Com otimizações:** 200-300 usuários ⚠️
- ✅ **Com upgrade Team:** 500+ usuários ✅

---

**Resposta curta:** Com os planos FREE atuais, o sistema **NÃO aguenta 500 usuários**. Precisa de upgrade para Supabase Team ($599/mês) ou implementar otimizações pesadas para funcionar com Pro ($45/mês) suportando ~200-300 usuários.

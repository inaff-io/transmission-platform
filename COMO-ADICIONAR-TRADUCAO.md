# Como Adicionar Link de Tradução

## 🎯 Objetivo

Configurar o link da tradução simultânea (Snapsight) através do painel administrativo.

## 📋 Passo a Passo

### 1. Acessar o Painel Admin

1. Faça login como **administrador** na plataforma
2. Acesse a página `/admin` ou clique em **"Admin"** no menu

### 2. Inserir Link de Tradução

Na seção de **Gerenciamento de Links**:

1. Clique em **"Adicionar Novo Link"** ou **"Novo"**
2. Preencha os campos:

   **Tipo**: `traducao` ou `Tradução`
   
   **URL**: Uma das opções abaixo

#### Opção 1: URL Direta (Recomendado)
```
https://www.snapsight.com/live-channel/l/93a696ad-92ee-436e-850a-68a971f9bf50/attendee/locations?lid=all
```

> ✅ A plataforma irá **automaticamente** converter para iframe com as configurações corretas

#### Opção 2: iFrame Completo (Avançado)
```html
<iframe 
  src="https://www.snapsight.com/live-channel/l/93a696ad-92ee-436e-850a-68a971f9bf50/attendee/locations?lid=all" 
  style="width:100%; height:100%; border:none;" 
  allow="microphone; camera; autoplay" 
  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
></iframe>
```

3. Clique em **"Salvar"** ou **"Adicionar"**

### 3. Verificar na Página de Transmissão

1. Vá para a página `/transmission`
2. Clique na aba **"Tradução"** (ícone 🌐)
3. O iframe do Snapsight deve carregar automaticamente

## 🔧 Configurações Automáticas

Quando você insere apenas a **URL** (opção 1), o sistema automaticamente:

### Converte para iFrame
```html
<iframe 
  src="SUA_URL_AQUI" 
  style="width:100%; height:100%; border:none;" 
  allow="microphone; camera; autoplay" 
  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
></iframe>
```

### Permissões Aplicadas

| Permissão | Descrição |
|-----------|-----------|
| `microphone` | Acesso ao microfone (se necessário) |
| `camera` | Acesso à câmera (se necessário) |
| `autoplay` | Reprodução automática de áudio |

### Sandbox (Segurança)

| Restrição | Descrição |
|-----------|-----------|
| `allow-same-origin` | Permite funcionamento do Snapsight |
| `allow-scripts` | Permite execução de JavaScript |
| `allow-popups` | Permite abrir popups (controles) |
| `allow-forms` | Permite interação com formulários |

## 📊 Estrutura do Banco de Dados

### Tabela: `links`

```sql
INSERT INTO links (tipo, url, ativo_em, atualizado_em) 
VALUES (
  'traducao',
  'https://www.snapsight.com/live-channel/l/93a696ad-92ee-436e-850a-68a971f9bf50/attendee/locations?lid=all',
  NOW(),
  NOW()
);
```

### Campos

- **tipo**: `'traducao'` (obrigatório, case-insensitive)
- **url**: Link do Snapsight ou iframe HTML
- **ativo_em**: Data/hora de ativação (automático)
- **atualizado_em**: Data/hora da última atualização (automático)

## 🔄 Atualizar Link Existente

Se já existe um link de tradução:

1. No painel admin, localize o link tipo **"Tradução"**
2. Clique em **"Editar"**
3. Atualize a **URL**
4. Clique em **"Salvar"**

A aba de tradução será **atualizada automaticamente** para todos os usuários.

## ❌ Resolver Problemas

### Tradução Não Aparece

**Problema**: Aba mostra "Tradução não disponível"

**Soluções**:

1. **Verificar Banco de Dados**
   - Confirme que existe um registro com `tipo = 'traducao'`
   - Verifique se o campo `url` não está vazio

2. **Verificar API**
   - Acesse: `/api/links/active`
   - Deve retornar: `{ "traducao": { "url": "..." } }`

3. **Verificar Console**
   - Abra DevTools (F12)
   - Veja se há erros de carregamento do iframe

### iFrame Não Carrega

**Problema**: Tela branca ou erro de carregamento

**Soluções**:

1. **Verificar URL**
   - URL deve começar com `https://`
   - Confirme que o link do Snapsight está correto

2. **Verificar CORS**
   - Snapsight pode ter restrições de embed
   - Teste abrindo a URL diretamente em nova aba

3. **Limpar Cache**
   - Ctrl + F5 para recarregar a página
   - Limpar cache do navegador

## 🌐 Variável de Ambiente (Fallback)

Se preferir configurar via **variável de ambiente**:

### Arquivo `.env` ou `.env.local`

```env
FALLBACK_TRADUCAO_URL=https://www.snapsight.com/live-channel/l/93a696ad-92ee-436e-850a-68a971f9bf50/attendee/locations?lid=all
```

ou

```env
NEXT_PUBLIC_FALLBACK_TRADUCAO_URL=https://www.snapsight.com/live-channel/l/93a696ad-92ee-436e-850a-68a971f9bf50/attendee/locations?lid=all
```

### Prioridade

1. **Links do Banco** (mais alta)
2. **Variável de Ambiente** (fallback)
3. **Mensagem "Não Disponível"** (quando nenhum dos anteriores existe)

## ✅ Checklist de Configuração

- [ ] Login no painel admin realizado
- [ ] Tipo definido como `traducao`
- [ ] URL do Snapsight inserida
- [ ] Link salvo no banco de dados
- [ ] Aba "Tradução" aparece na página `/transmission`
- [ ] iFrame carrega corretamente
- [ ] Tradução funciona para todos os usuários

## 📝 Exemplo Completo

### Via Painel Admin

```
Tipo: traducao
URL: https://www.snapsight.com/live-channel/l/93a696ad-92ee-436e-850a-68a971f9bf50/attendee/locations?lid=all
```

### Via SQL (Alternativa)

```sql
-- Verificar se já existe
SELECT * FROM links WHERE tipo ILIKE '%trad%';

-- Inserir novo
INSERT INTO links (tipo, url, ativo_em, atualizado_em) 
VALUES (
  'traducao',
  'https://www.snapsight.com/live-channel/l/93a696ad-92ee-436e-850a-68a971f9bf50/attendee/locations?lid=all',
  NOW(),
  NOW()
);

-- Ou atualizar existente
UPDATE links 
SET url = 'https://www.snapsight.com/live-channel/l/93a696ad-92ee-436e-850a-68a971f9bf50/attendee/locations?lid=all',
    atualizado_em = NOW()
WHERE tipo ILIKE '%trad%';
```

## 🎉 Resultado Final

Após configuração bem-sucedida:

1. **3 Abas Visíveis**: Bate Papo | Tradução | Programação
2. **Tradução Funcional**: iFrame do Snapsight carregando
3. **Idiomas Disponíveis**: Seleção pelo usuário no Snapsight
4. **Responsivo**: Funciona em desktop e mobile
5. **Seguro**: Sandbox aplicado automaticamente

---

**Data**: 21/10/2025  
**Atualização**: Sistema de tradução integrado ao banco de dados  
**Padrão**: Mesmo sistema usado para programação

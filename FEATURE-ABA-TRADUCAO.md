# Nova Funcionalidade: Aba de Tradução

## 📋 Descrição

Adicionada nova aba **"Tradução"** na interface de transmissão, posicionada entre "Bate Papo" e "Programação".

**✨ ATUALIZAÇÃO**: Agora usa o **mesmo sistema da Programação** - link vem do banco de dados!

## 🎯 Localização

**Página**: `/transmission` (Área protegida)

**Posição das Abas**:
1. 💬 Bate Papo
2. 🌐 **Tradução** (NOVO)
3. 📅 Programação

## 🔧 Implementação

### Arquivos Modificados

#### Frontend: `src/app/(protected)/transmission/page.tsx`

**Mudanças**:
1. ✅ Estado `traducaoLink` para armazenar link do banco
2. ✅ Busca link via API `/api/links/active`
3. ✅ Renderiza usando `dangerouslySetInnerHTML` (igual programação)
4. ✅ Fallback: "Tradução não disponível" quando sem link

#### Backend: `src/app/api/links/active/route.ts`

**Mudanças**:
1. ✅ Tipo `'traducao'` adicionado ao `PublicLink`
2. ✅ Função `normalizeTipo()` reconhece 'traducao'
3. ✅ Função `pickFromLinks()` busca link de tradução
4. ✅ Conversão automática de URL para iframe
5. ✅ Sandbox e permissions aplicados automaticamente
6. ✅ Fallback via `FALLBACK_TRADUCAO_URL`

### Estado e API

### Estado e API

#### 1. Estado do Frontend

```typescript
const [traducaoLink, setTraducaoLink] = useState<Link | null>(null);
const [rightTab, setRightTab] = useState<'programacao' | 'traducao' | 'chat'>('chat');
```

#### 2. Busca na API

```typescript
const data = await fetch('/api/links/active').then(r => r.json());
setTraducaoLink(data.traducao ?? null);
```

#### 3. Renderização Condicional

```tsx
{traducaoLink?.url ? (
  <div dangerouslySetInnerHTML={{ __html: traducaoLink.url }} />
) : (
  <div>Tradução não disponível</div>
)}
```

### Conversão Automática de URL

Quando você cadastra **apenas a URL** no banco:

```
https://www.snapsight.com/live-channel/l/93a696ad...
```

O sistema **automaticamente converte** para:

```html
<iframe 
  src="https://www.snapsight.com/live-channel/l/93a696ad..." 
  style="width:100%; height:100%; border:none;" 
  allow="microphone; camera; autoplay" 
  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
></iframe>
```

## � Como Configurar

### Via Painel Admin (Recomendado)

1. Login como **admin**
2. Vá para `/admin`
3. **Adicionar Novo Link**:
   - **Tipo**: `traducao`
   - **URL**: `https://www.snapsight.com/live-channel/l/93a696ad-92ee-436e-850a-68a971f9bf50/attendee/locations?lid=all`
4. **Salvar**

### Via SQL (Alternativa)

```sql
INSERT INTO links (tipo, url, ativo_em, atualizado_em) 
VALUES (
  'traducao',
  'https://www.snapsight.com/live-channel/l/93a696ad-92ee-436e-850a-68a971f9bf50/attendee/locations?lid=all',
  NOW(),
  NOW()
);
```

### Via Variável de Ambiente (Fallback)

Arquivo `.env.local`:

```env
FALLBACK_TRADUCAO_URL=https://www.snapsight.com/live-channel/l/93a696ad-92ee-436e-850a-68a971f9bf50/attendee/locations?lid=all
```

**Prioridade**: Banco de Dados > Variável de Ambiente > "Não Disponível"

📖 **Guia Completo**: Veja `COMO-ADICIONAR-TRADUCAO.md` para mais detalhes.

## �🔒 Segurança do iFrame

### Atributos de Segurança Aplicados

#### `allow`
Permissões concedidas ao conteúdo do iframe:
- **microphone**: Permite acesso ao microfone (necessário para tradução)
- **camera**: Permite acesso à câmera (se aplicável)
- **autoplay**: Permite reprodução automática de áudio

#### `sandbox`
Restrições de segurança aplicadas:
- **allow-same-origin**: Permite que o conteúdo seja tratado como mesma origem
- **allow-scripts**: Permite execução de JavaScript
- **allow-popups**: Permite abrir pop-ups (se necessário)
- **allow-forms**: Permite envio de formulários

### Por que essas permissões?

O **Snapsight** é uma plataforma de tradução simultânea que requer:
1. ✅ Acesso a áudio (microphone/autoplay)
2. ✅ Execução de scripts (allow-scripts)
3. ✅ Contexto de mesma origem (allow-same-origin)
4. ✅ Possibilidade de interação (allow-forms)

## 🎨 Design

### Ícone
Ícone de tradução/idiomas (🌐) usando Heroicons

### Estilo
- Mesmo padrão visual das outras abas
- Azul quando ativa (`border-blue-600`)
- Cinza quando inativa
- Hover effect em ambos os temas (claro/escuro)
- Suporte a dark mode completo

### Responsividade
- Mobile: Altura 450px
- Desktop (lg): Altura 500px
- Iframe ocupa 100% da área disponível

## 📊 Fluxo de Uso

1. **Usuário acessa** `/transmission`
2. **Vê 3 abas** na coluna direita:
   - Bate Papo (padrão)
   - **Tradução** (novo)
   - Programação
3. **Clica em "Tradução"**
4. **Iframe carrega** a interface do Snapsight
5. **Usuário pode**:
   - Selecionar idioma
   - Ouvir tradução simultânea
   - Ajustar configurações de áudio

## � Fluxo de Uso

1. **Admin configura** link de tradução no banco
2. **Usuário acessa** `/transmission`
3. **API retorna** `{ traducao: { url: "..." } }`
4. **Frontend renderiza** aba "Tradução"
5. **Usuário clica** na aba
6. **iframe carrega** automaticamente
7. **Usuário seleciona** idioma no Snapsight

## 🗄️ Estrutura do Banco

### Tabela `links`

| Campo | Tipo | Exemplo |
|-------|------|---------|
| `id` | UUID | `550e8400-e29b-41d4-a716-...` |
| `tipo` | VARCHAR | `'traducao'` |
| `url` | TEXT | `https://www.snapsight.com/...` |
| `ativo_em` | TIMESTAMP | `2025-10-21 10:30:00` |
| `atualizado_em` | TIMESTAMP | `2025-10-21 10:30:00` |

### Normalização do Tipo

O sistema aceita variações:
- ✅ `traducao`
- ✅ `Tradução`
- ✅ `TRADUCAO`
- ✅ `tradução`

Todos são normalizados para `'traducao'`.

## �🔗 URL Embedada

```
https://www.snapsight.com/live-channel/l/93a696ad-92ee-436e-850a-68a971f9bf50/attendee/locations?lid=all
```

**Componentes**:
- **live-channel**: Modo de canal ao vivo
- **l/93a696ad...**: ID único do canal
- **attendee**: Modo participante (não apresentador)
- **locations**: Página de seleção de locais/idiomas
- **lid=all**: Mostrar todos os idiomas disponíveis

## ✅ Vantagens

1. **Integração Seamless**
   - Não precisa sair da página principal
   - Troca instantânea entre abas
   - Mantém contexto da transmissão

2. **Acessibilidade**
   - Tradução disponível para todos
   - Múltiplos idiomas suportados
   - Interface familiar do Snapsight

3. **Performance**
   - Carregamento sob demanda (lazy)
   - Não impacta chat ou programação
   - Isolado via iframe (segurança)

4. **Manutenção**
   - URL externa (gerenciada pelo Snapsight)
   - Sem necessidade de manter servidor próprio
   - Atualizações automáticas da plataforma

## 🎯 Casos de Uso

### Eventos Multilíngues
- Congressos internacionais
- Conferências com palestrantes estrangeiros
- Webinars globais

### Acessibilidade
- Participantes que não falam português
- Inclusão de audiência internacional
- Tradução para libras (se suportado)

### Gravações
- Reprises com múltiplos idiomas
- Conteúdo on-demand traduzido
- Arquivo de eventos passados

## 🔮 Melhorias Futuras

1. **Interface Admin Melhorada**
   - Toggle on/off para tradução
   - Preview do iframe
   - Validação de URL

2. **Múltiplos Idiomas**
   - Suporte a vários links de tradução
   - Seletor de idioma na própria aba
   - Links por idioma específico

3. **Indicador de Status**
   - Badge "AO VIVO" quando tradução ativa
   - Contador de ouvintes
   - Idiomas disponíveis no momento

4. **Analytics**
   - Rastreamento de uso da tradução
   - Idiomas mais acessados
   - Tempo médio de uso

5. **Fallback Inteligente**
   - Mensagem personalizada quando offline
   - Link para abrir em nova janela
   - Instruções de uso

## 📝 Commits Relacionados

1. **9d85c84** - feat: Adiciona aba de Tradução com Snapsight embed
   - Implementação inicial com iframe hardcoded

2. **2bd5704** - feat: Tradução agora usa link do banco de dados (padrão programação)
   - Migração para sistema dinâmico
   - API atualizada
   - Conversão automática de URL

3. **7c07648** - docs: Adiciona guia de configuração do link de tradução
   - Documentação completa

---

**Data**: 21/10/2025  
**Status**: ✅ IMPLEMENTADO E INTEGRADO AO BANCO  
**Tipo**: Feature (Nova Funcionalidade)  
**Padrão**: Mesmo sistema da Programação  
**Impacto**: Melhoria na experiência de usuários multilíngues

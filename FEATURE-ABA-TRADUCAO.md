# Nova Funcionalidade: Aba de Tradução

## 📋 Descrição

Adicionada nova aba **"Tradução"** na interface de transmissão, posicionada entre "Bate Papo" e "Programação".

## 🎯 Localização

**Página**: `/transmission` (Área protegida)

**Posição das Abas**:
1. 💬 Bate Papo
2. 🌐 **Tradução** (NOVO)
3. 📅 Programação

## 🔧 Implementação

### Arquivo Modificado
`src/app/(protected)/transmission/page.tsx`

### Alterações Realizadas

#### 1. Estado da Aba
```typescript
// ANTES
const [rightTab, setRightTab] = useState<'programacao' | 'chat'>('chat');

// DEPOIS
const [rightTab, setRightTab] = useState<'programacao' | 'traducao' | 'chat'>('chat');
```

#### 2. Botão da Aba
```tsx
<button
  onClick={() => setRightTab('traducao')}
  className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-t-md border-b-2 ${
    rightTab === 'traducao' 
      ? 'border-blue-600 text-blue-700 dark:text-blue-400' 
      : 'border-transparent text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
  }`}
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
  </svg>
  Tradução
</button>
```

#### 3. Conteúdo da Aba
```tsx
rightTab === 'traducao' ? (
  <div className="absolute inset-0 rounded-lg overflow-hidden shadow bg-white dark:bg-gray-900">
    <iframe
      src="https://www.snapsight.com/live-channel/l/93a696ad-92ee-436e-850a-68a971f9bf50/attendee/locations?lid=all"
      className="w-full h-full border-0"
      title="Tradução Simultânea"
      allow="microphone; camera; autoplay"
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
    />
  </div>
)
```

## 🔒 Segurança do iFrame

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

## 🔗 URL Embedada

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

1. **Link Dinâmico**
   - Admin pode configurar URL do Snapsight
   - Trocar canal de tradução sem alterar código
   - Ativar/desativar tradução conforme necessidade

2. **Indicador de Idiomas**
   - Badge mostrando idiomas disponíveis
   - Contador de ouvintes por idioma
   - Status da tradução (online/offline)

3. **Integração com API**
   - Verificar se tradução está ativa
   - Mostrar número de tradutores conectados
   - Estatísticas de uso

4. **Fallback**
   - Mensagem quando tradução não disponível
   - Link direto para abrir em nova janela
   - Instruções de uso

---

**Data**: 21/10/2025  
**Status**: ✅ IMPLEMENTADO  
**Tipo**: Feature (Nova Funcionalidade)  
**Impacto**: Melhoria na experiência de usuários multilíngues

# Sistema de Gerenciamento de Logo - Painel Admin

## 📋 Visão Geral

Foi implementado um sistema completo para gerenciar o logo do evento que aparece no cabeçalho da página de transmissão, **diretamente pelo painel administrativo**.

## ✨ Funcionalidades

### 1. **Upload de Logo**
- Faça upload de qualquer imagem (PNG, JPG, WEBP)
- Tamanho máximo: 5MB
- Dimensões recomendadas: 1200x400px
- Suporte para fundo transparente (PNG)

### 2. **Preview em Tempo Real**
- Visualize o logo atual antes de fazer mudanças
- Preview da imagem que será exibida no cabeçalho

### 3. **Remover Logo**
- Opção para remover o logo atual
- Volta automaticamente para o fallback com gradiente azul

### 4. **Validações**
- Verifica tipo de arquivo (apenas imagens)
- Valida tamanho máximo (5MB)
- Feedback visual de sucesso/erro

## 🎯 Como Usar

### Passo 1: Acessar o Painel Admin
1. Faça login como **Admin** em `/auth/admin`
2. Acesse o **Painel Administrativo** em `/admin`

### Passo 2: Localizar Seção de Logo
No painel admin, na barra lateral esquerda, você verá uma seção chamada:
```
┌─────────────────────────────┐
│ Logo do Evento         [Cabeçalho] │
├─────────────────────────────┤
│ Visualização Atual          │
│ [Preview da imagem]         │
├─────────────────────────────┤
│ Recomendações:              │
│ • Formato: PNG, JPG ou WEBP │
│ • Tamanho máximo: 5MB       │
│ • Dimensões: 1200x400px     │
│ • Fundo transparente (PNG)  │
├─────────────────────────────┤
│ [Enviar Novo Logo] [Remover]│
└─────────────────────────────┘
```

### Passo 3: Fazer Upload
1. Clique em **"Enviar Novo Logo"**
2. Selecione sua imagem no computador
3. Aguarde o upload (aparecerá "Enviando...")
4. Mensagem de sucesso aparecerá quando concluído

### Passo 4: Verificar Resultado
1. Acesse `/transmission` em outra aba
2. O logo será exibido no cabeçalho (altura de 480px)
3. A imagem é centralizada e ajustada automaticamente

## 🔧 Detalhes Técnicos

### Arquivos Criados

#### 1. **Componente Admin** (`src/app/(protected)/admin/components/AdminLogo.tsx`)
- Interface React com upload de arquivo
- Preview da imagem atual
- Botões de ação (upload/remover)
- Validações client-side
- Feedback visual de status

#### 2. **API de Upload** (`src/app/api/admin/logo/route.ts`)
- **POST**: Upload de nova imagem
- **DELETE**: Remover imagem atual
- **GET**: Verificar se logo existe
- Validações de autenticação (apenas Admin)
- Validações de arquivo (tipo, tamanho)

#### 3. **Integração no Painel** (`src/app/(protected)/admin/page.tsx`)
- Componente AdminLogo adicionado ao painel
- Posicionado logo após "Métricas Rápidas"
- Antes de "Gerenciamento de Programação"

### Localização do Arquivo

O logo é salvo em:
```
public/upload/evento/logo/doHKepqoQ8RtQMW5qzQ1IF28zag8.png
```

E servido publicamente em:
```
/upload/evento/logo/doHKepqoQ8RtQMW5qzQ1IF28zag8.png
```

### Página de Transmissão

O logo é exibido em `src/app/(protected)/transmission/page.tsx`:
- Seção com `id="topo"` e altura de 480px
- Fundo branco com sombra
- Imagem centralizada com `max-h-[450px]`
- Fallback com gradiente azul (se logo não existir)

## 🛡️ Segurança

### Autenticação
- Apenas usuários com categoria **"Admin"** podem fazer upload/remover
- Token JWT validado em todas as requisições
- Retorna erro 401 se não autenticado ou não-admin

### Validações de Arquivo
```typescript
// Tipo de arquivo
if (!file.type.startsWith('image/')) {
  return error('Arquivo deve ser uma imagem');
}

// Tamanho máximo
if (file.size > 5 * 1024 * 1024) {
  return error('Arquivo muito grande. Máximo: 5MB');
}
```

## 📱 Responsividade

O logo se adapta automaticamente a diferentes tamanhos de tela:
- **Desktop**: Max-height 450px, max-width 100%
- **Tablet**: Ajusta proporcionalmente
- **Mobile**: Centralizado e reduzido conforme necessário

## 🎨 Design

### Componente Admin
- Card branco com sombra
- Badge azul "Cabeçalho" no topo
- Box de preview com borda tracejada
- Botões azul (upload) e vermelho (remover)
- Ícones SVG para ações
- Loading spinner durante upload

### Cabeçalho da Transmissão
```css
altura: 480px
fundo: branco
sombra: shadow-md
borda inferior: 2px cinza-200
imagem max-altura: 450px
objeto: contain (mantém proporção)
```

### Fallback (sem logo)
```css
gradiente: azul-600 → indigo-600
texto: branco
bordas arredondadas: rounded-xl
sombra: shadow-2xl
padding: 8 (2rem)
```

## 🔄 Fluxo de Trabalho

```mermaid
graph LR
A[Admin acessa /admin] --> B[Clica "Enviar Novo Logo"]
B --> C[Seleciona arquivo no PC]
C --> D[Validações client-side]
D --> E[POST /api/admin/logo]
E --> F[Validações server-side]
F --> G[Salva em public/upload/...]
G --> H[Retorna URL + sucesso]
H --> I[Preview atualizado]
I --> J[Logo visível em /transmission]
```

## 🐛 Troubleshooting

### Logo não aparece após upload
1. **Verifique se o arquivo foi salvo**: Vá em `public/upload/evento/logo/` e confirme que `doHKepqoQ8RtQMW5qzQ1IF28zag8.png` existe
2. **Limpe o cache do navegador**: Ctrl+F5 ou Cmd+Shift+R
3. **Verifique o console**: Abra DevTools (F12) e veja se há erros

### Erro "Não autenticado" ou "Acesso negado"
- Faça logout e login novamente como Admin
- Verifique se o token JWT não expirou
- Confirme que sua categoria é "admin" (não "user" ou "palestrante")

### Upload muito lento
- Reduza o tamanho da imagem (use ferramentas online de compressão)
- Verifique sua conexão de internet
- Tamanho máximo: 5MB

### Imagem cortada ou distorcida
- Use dimensões próximas a 1200x400px (proporção 3:1)
- A imagem é automaticamente ajustada com `object-contain`
- Não há corte, apenas redimensionamento proporcional

## 📊 Logs

O sistema registra logs no console do servidor:

```bash
# Upload bem-sucedido
[AdminLogo] Logo atualizado: D:\...\public\upload\evento\logo\doHKepqoQ8RtQMW5qzQ1IF28zag8.png

# Remoção bem-sucedida
[AdminLogo] Logo removido: D:\...\public\upload\evento\logo\doHKepqoQ8RtQMW5qzQ1IF28zag8.png

# Erro
[AdminLogo] Erro ao fazer upload: [mensagem de erro]
```

## 🎯 Próximos Passos (Sugestões)

1. **Histórico de Logos**: Salvar versões anteriores
2. **Crop de Imagem**: Permitir recortar imagem antes do upload
3. **Múltiplos Logos**: Suportar logo do evento + logo de patrocinadores
4. **Galeria**: Biblioteca de logos pré-aprovados
5. **Preview em Tempo Real**: Ver mudança sem refresh da página

## ✅ Checklist de Implementação

- [x] Componente AdminLogo criado
- [x] API de upload (/api/admin/logo) implementada
- [x] Validações client-side (tipo, tamanho)
- [x] Validações server-side (autenticação, arquivo)
- [x] Integração no painel admin
- [x] Preview em tempo real
- [x] Botão de remover logo
- [x] Feedback visual (loading, sucesso, erro)
- [x] Responsividade (mobile, tablet, desktop)
- [x] Fallback com gradiente azul
- [x] Cache busting (parâmetro ?t=timestamp)
- [x] Documentação completa

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do servidor (terminal onde rodou `npm run dev`)
2. Verifique o console do navegador (F12 → Console)
3. Confirme permissões de escrita na pasta `public/upload/evento/logo/`

---

**Versão**: 1.0  
**Data**: Outubro 2025  
**Status**: ✅ Produção

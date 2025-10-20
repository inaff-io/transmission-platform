# 📝 Página de Inscrição de Usuários

## 📍 Localização
- **Arquivo:** `src/app/inscricao/page.tsx`
- **Rota:** `/inscricao`
- **Tipo:** Página pública (não requer autenticação)

---

## 🎯 Descrição

Página de formulário público para inscrição de novos usuários normais no evento. A página possui uma interface moderna e responsiva com:

1. **Logo do Evento** (topo)
2. **Formulário de Inscrição** (centro)
3. **Footer com informações institucionais** (rodapé)

---

## ✨ Características

### 🎨 Design
- **Layout moderno** com gradiente de fundo (azul para índigo)
- **Card com sombra** e bordas arredondadas para o formulário
- **Animações suaves** nos botões e elementos interativos
- **Responsivo** - funciona em mobile, tablet e desktop
- **Loading state** no botão durante submissão
- **Mensagens visuais** de erro e sucesso

### 📋 Campos do Formulário
1. **Nome Completo** (obrigatório, mínimo 3 caracteres)
2. **Email** (obrigatório, validação de formato)
3. **CPF** (obrigatório, 11 dígitos, formatação automática)

### 🔒 Validações Implementadas

#### Frontend (antes de enviar):
- ✅ Nome: mínimo 3 caracteres
- ✅ Email: formato válido (`usuario@dominio.com`)
- ✅ CPF: exatamente 11 dígitos numéricos

#### Formatação Automática:
- 📱 **CPF** formatado automaticamente enquanto digita
  - Entrada: `12345678900`
  - Exibição: `123.456.789-00`

#### Backend (API `/api/usuarios`):
- ✅ Geração automática de ID único do email
- ✅ Verificação de duplicatas (email ou CPF)
- ✅ Email convertido para lowercase
- ✅ CPF limpo de caracteres especiais
- ✅ Categoria definida como `'user'` (usuário normal)
- ✅ Status e ativo definidos como `true`

---

## 🔄 Fluxo de Inscrição

```
1. Usuário acessa /inscricao
   ↓
2. Preenche formulário (nome, email, CPF)
   ↓
3. Clica em "Realizar Inscrição"
   ↓
4. Validações frontend executadas
   ↓
5. POST para /api/usuarios
   ↓
6. Backend valida e cria usuário
   ↓
7. Mensagem de sucesso exibida
   ↓
8. Redirecionamento automático para /auth/login (3 segundos)
```

---

## 🎯 Casos de Uso

### ✅ Inscrição Bem-Sucedida
```
Input:
- Nome: "João Silva"
- Email: "joao.silva@exemplo.com"
- CPF: "123.456.789-00"

Output:
✅ "Inscrição realizada com sucesso! Você receberá mais informações por email."

Backend cria:
- id: "joao_silva"
- nome: "João Silva"
- email: "joao.silva@exemplo.com"
- cpf: "12345678900"
- categoria: "user"
- status: true
- ativo: true
```

### ❌ Erros Comuns

#### 1. Email Inválido
```
Input: "emailinvalido"
Output: ❌ "Email inválido"
```

#### 2. CPF Incompleto
```
Input: "123.456"
Output: ❌ "CPF deve conter 11 dígitos"
```

#### 3. Nome Muito Curto
```
Input: "Jo"
Output: ❌ "Nome deve ter pelo menos 3 caracteres"
```

#### 4. Usuário Duplicado
```
Backend retorna: ❌ "Email já cadastrado" ou "CPF já cadastrado"
```

---

## 🎨 Componentes Visuais

### 1. Logo Section
```tsx
- Imagem: /logo-evento.png
- Loading spinner enquanto carrega
- Transição suave de opacidade
- Altura responsiva (24/32/40)
```

### 2. Form Card
```tsx
- Background: branco
- Shadow: xl
- Border: cinza claro
- Padding: responsivo
- Border radius: xl
```

### 3. Botão de Submit
```tsx
- Cor: Indigo 600 → 700 (hover)
- Animações: scale no hover/click
- Loading spinner durante submissão
- Desabilitado durante envio
```

### 4. Mensagens de Feedback
```tsx
✅ Sucesso: Verde com ícone de check
❌ Erro: Vermelho com ícone de X
ℹ️ Info: Azul com ícone de informação
```

---

## 📱 Responsividade

### Mobile (< 640px)
- Logo: altura 24 (96px)
- Padding: 4 (16px)
- Formulário: largura completa

### Tablet (640px - 1024px)
- Logo: altura 32 (128px)
- Padding: 6 (24px)
- Formulário: max-width-md

### Desktop (> 1024px)
- Logo: altura 40 (160px)
- Padding: 8 (32px)
- Formulário: max-width-md centralizado

---

## 🔗 Navegação

### Links na Página
1. **"Faça login aqui"** → `/auth/login`
   - Para usuários que já possuem cadastro

### Redirecionamentos Automáticos
1. **Após sucesso** → `/auth/login` (3 segundos)
   - Permite que usuário faça login imediatamente

---

## 🧪 Como Testar

### 1. Acesso Direto
```bash
# Inicie o servidor
npm run dev

# Acesse no navegador
http://localhost:3000/inscricao
```

### 2. Teste de Inscrição Válida
```
1. Abra /inscricao
2. Preencha:
   - Nome: "Teste Usuario"
   - Email: "teste@exemplo.com"
   - CPF: "999.888.777-66"
3. Clique em "Realizar Inscrição"
4. Aguarde mensagem de sucesso
5. Será redirecionado para /auth/login
```

### 3. Teste de Validações
```
Nome curto:
- Preencha "Jo" → ❌ "Nome deve ter pelo menos 3 caracteres"

Email inválido:
- Preencha "emailerrado" → ❌ "Email inválido"

CPF incompleto:
- Preencha "123456" → ❌ "CPF deve conter 11 dígitos"

Usuário duplicado:
- Use email/CPF já cadastrado → ❌ Erro de duplicata
```

### 4. Teste de Responsividade
```
1. Abra DevTools (F12)
2. Ative modo responsivo (Ctrl+Shift+M)
3. Teste em diferentes tamanhos:
   - Mobile: 375px
   - Tablet: 768px
   - Desktop: 1920px
4. Verifique que logo, formulário e footer se adaptam
```

---

## 🔧 Configuração Necessária

### Logo do Evento
- **Localização:** `public/logo-evento.png`
- **Formato:** PNG com transparência
- **Recomendado:** Alta resolução (mínimo 800x200px)

### API de Usuários
- **Endpoint:** `POST /api/usuarios`
- **Autenticação:** Não requerida para criação pública
- **Validações:** Implementadas conforme correção anterior

---

## 🎯 Melhorias Futuras Possíveis

### 1. Campos Adicionais
```tsx
- Telefone
- Instituição/Empresa
- Cargo/Profissão
- Cidade/Estado
```

### 2. Confirmação por Email
```tsx
- Enviar email de confirmação
- Link de ativação de conta
- Verificação de email válido
```

### 3. Termos de Uso
```tsx
- Checkbox de aceitação de termos
- Modal com texto completo
- Obrigatório para submissão
```

### 4. Captcha
```tsx
- Google reCAPTCHA v3
- Proteção contra bots
- Validação no backend
```

### 5. Upload de Foto
```tsx
- Campo opcional para foto do perfil
- Preview antes do upload
- Validação de tipo e tamanho
```

---

## 📊 Estrutura de Dados

### Dados Enviados para API
```typescript
{
  nome: string;          // "João Silva"
  email: string;         // "joao.silva@exemplo.com" (lowercase)
  cpf: string;           // "12345678900" (apenas números)
  categoria: "user";     // Sempre "user" para inscrições públicas
}
```

### Dados Criados no Backend
```typescript
{
  id: string;            // "joao_silva" (gerado do email)
  nome: string;          // "João Silva"
  email: string;         // "joao.silva@exemplo.com"
  cpf: string;           // "12345678900"
  categoria: "user";     // Categoria de usuário normal
  status: true;          // Ativo
  ativo: true;           // Habilitado
  created_at: Date;      // Timestamp de criação
  updated_at: Date;      // Timestamp de atualização
}
```

---

## 🎨 Cores e Estilo

### Paleta de Cores
```css
/* Primary */
Indigo 600: #4F46E5 (botões, links)
Indigo 700: #4338CA (botão hover)

/* Background */
Gradient: from-blue-50 via-white to-indigo-50

/* Feedback */
Verde 50/400/800: Sucesso
Vermelho 50/400/800: Erro
Azul 50/400/700: Informação

/* Neutros */
Branco: #FFFFFF (cards)
Cinza 100-900: Textos e bordas
```

### Tipografia
```css
/* Títulos */
h1: 3xl (30px) → 4xl (36px) em desktop
font-weight: extrabold

/* Labels */
text-sm (14px)
font-weight: semibold

/* Inputs */
text-base (16px)
font-weight: normal

/* Mensagens */
text-sm (14px)
font-weight: medium
```

---

## 🔐 Segurança

### Frontend
- ✅ Validação de formato antes do envio
- ✅ Sanitização de entrada (trim, lowercase)
- ✅ Limite de caracteres no CPF (14 com formatação)
- ✅ Desabilitação de botão durante submissão

### Backend
- ✅ Validação de formato de email (regex)
- ✅ Validação de tamanho de CPF (11 dígitos)
- ✅ Verificação de duplicatas
- ✅ Geração segura de ID único
- ✅ Retorno de erros JSON específicos

---

## 📝 Logs e Monitoramento

### Console do Navegador
```javascript
// Em caso de erro, verifique:
// Network tab → /api/usuarios → Response
// Console tab → Mensagens de erro
```

### Logs do Backend
```javascript
// src/app/api/usuarios/route.ts
// Logs com prefixo [POST /api/usuarios]
// Inclui: dados recebidos, validações, criação
```

---

## ✅ Checklist de Funcionalidade

- [x] Logo do evento carregando corretamente
- [x] Formulário com 3 campos (nome, email, CPF)
- [x] Formatação automática de CPF
- [x] Validações frontend funcionando
- [x] Mensagens de erro específicas
- [x] Mensagem de sucesso após inscrição
- [x] Redirecionamento automático para login
- [x] Link para página de login
- [x] Footer com informações institucionais
- [x] Responsividade em mobile/tablet/desktop
- [x] Loading state no botão
- [x] Desabilitação durante submissão
- [x] Animações suaves
- [x] Acessibilidade (labels, required)

---

## 🚀 Deploy

### Vercel
```bash
# A página será automaticamente disponibilizada em:
https://seu-dominio.vercel.app/inscricao

# Configurações necessárias:
# 1. Logo em public/logo-evento.png
# 2. Variáveis de ambiente do Supabase configuradas
# 3. API /api/usuarios funcionando
```

---

## 📞 Suporte

Em caso de problemas:

1. **Verifique se a logo existe:** `public/logo-evento.png`
2. **Teste a API diretamente:** `POST /api/usuarios`
3. **Verifique logs do console:** F12 → Console/Network
4. **Teste com dados válidos:** Nome (>3 chars), Email válido, CPF (11 dígitos)

---

**Criado em:** 20/10/2025  
**Última atualização:** 20/10/2025  
**Versão:** 1.0.0

# Configuração de Variáveis de Ambiente

## ⚠️ Problema Atual

Se você está recebendo o erro:
```
Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

Isso significa que as **variáveis de ambiente do Supabase não estão configuradas**.

## 🔧 Solução

1. **Copie o arquivo de exemplo**:
   ```bash
   cp .env.local.example .env.local
   ```

2. **Configure suas credenciais do Supabase** em `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sua_anon_key
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

3. **Obtenha suas credenciais**:
   - Acesse [Supabase Dashboard](https://app.supabase.com)
   - Selecione seu projeto
   - Vá em **Settings** → **API**
   - Copie:
     - **URL do Projeto** → `NEXT_PUBLIC_SUPABASE_URL`
     - **anon/public key** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
     - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Mantenha esta chave secreta!)

4. **Reinicie o servidor**:
   ```bash
   npm run dev
   ```

## 📝 Notas

- O arquivo `.env.local` está no `.gitignore` e não será commitado
- Nunca compartilhe sua `SUPABASE_SERVICE_ROLE_KEY` publicamente
- Se não tiver um projeto Supabase, crie um em [supabase.com](https://supabase.com)

## 🔄 Melhorias Implementadas

- ✅ Tratamento adequado de erros quando variáveis não estão configuradas
- ✅ Mensagens de erro em JSON (não HTML)
- ✅ Validação de Content-Type nas respostas da API
- ✅ Remoção do `router.refresh()` que causava reload desnecessário

#!/bin/bash

echo "🚀 Configurando variáveis de ambiente na Vercel..."
echo ""
echo "Certifique-se de estar autenticado na Vercel CLI (vercel login)"
echo ""

# Lê as variáveis do arquivo .env.local
if [ ! -f .env.local ]; then
    echo "❌ Arquivo .env.local não encontrado!"
    exit 1
fi

# Extrai e adiciona cada variável
echo "📝 Adicionando variáveis de ambiente..."

# NEXT_PUBLIC_SUPABASE_URL
SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d '=' -f2)
echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production

# DATABASE_URL
DATABASE_URL=$(grep "^DATABASE_URL=" .env.local | cut -d '=' -f2-)
echo "$DATABASE_URL" | vercel env add DATABASE_URL production

# JWT_SECRET
JWT_SECRET=$(grep "^JWT_SECRET=" .env.local | cut -d '=' -f2)
echo "$JWT_SECRET" | vercel env add JWT_SECRET production

# SUPABASE_SERVICE_ROLE_KEY
SERVICE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d '=' -f2)
echo "$SERVICE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY production

# NEXT_PUBLIC_BASE_URL (você precisará atualizar isso com a URL da Vercel)
echo "⚠️  IMPORTANTE: Atualize NEXT_PUBLIC_BASE_URL com a URL da Vercel"
echo "https://transmission-platform-main.vercel.app" | vercel env add NEXT_PUBLIC_BASE_URL production

echo ""
echo "✅ Variáveis de ambiente configuradas!"
echo ""
echo "Agora você pode fazer o deploy com: vercel --prod"

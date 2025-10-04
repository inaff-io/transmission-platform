import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { verifyToken } from '@/lib/jwt-server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('authToken')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    try {
      const payload = await verifyToken(token)
      const now = new Date()

      // Obtém informações do request primeiro para evitar erro de body já lido
      const body = await request.json()
      const headers = new Headers(request.headers)
      const ip = headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown'

      const supabase = createAdminClient()

      // Verifica se o usuário existe
      const { data: user, error: userErr } = await supabase
        .from('usuarios')
        .select('id')
        .eq('id', payload.userId)
        .single()
      if (userErr || !user) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
      }

      // Atualiza last_active
      await supabase
        .from('usuarios')
        .update({ last_active: now.toISOString() })
        .eq('id', payload.userId)

      // Insere histórico de acesso
      await supabase.from('historico_acessos').insert({
        usuario_id: payload.userId,
        acao: 'heartbeat',
        ip: ip.toString(),
        user_agent: body.userAgent || 'unknown'
      })

      // Atualiza ou cria sessão simples (mantendo lógica mínima)
      const sessionId = `${payload.userId}_${now.toISOString().split('T')[0]}`
      const { data: sessaoExistente } = await supabase
        .from('sessoes')
        .select('id,duracao')
        .eq('id', sessionId)
        .maybeSingle()
      if (!sessaoExistente) {
        await supabase.from('sessoes').insert({
          id: sessionId,
          usuario_id: payload.userId,
          iniciada_em: now.toISOString(),
          finalizada_em: now.toISOString(),
          duracao: 30
        })
      } else {
        await supabase.from('sessoes').update({
          finalizada_em: now.toISOString(),
          duracao: (sessaoExistente.duracao || 0) + 30
        }).eq('id', sessionId)
      }

      return NextResponse.json({ success: true })

    } catch (tokenError) {
      console.error('Token verification error:', tokenError)
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('POST /api/auth/heartbeat error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { createPgClient } from '@/lib/db/pg-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function safeUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (!trimmed) return null
  return trimmed
}

export async function GET(
  _request: Request,
  context: { params: { day?: string } }
) {
  const dayParam = context.params?.day
  const day = Number(dayParam)
  if (!day || Number.isNaN(day)) {
    return NextResponse.json({ error: 'Parâmetro de dia inválido' }, { status: 400 })
  }

  const client = createPgClient()
  try {
    await client.connect()

    // Tenta buscar reprise por dia baseado em timestamps
    const query = `
      SELECT id, tipo, url, ativo_em, atualizado_em, created_at
      FROM links
      WHERE tipo = 'reprise'
        AND EXTRACT(DAY FROM COALESCE(atualizado_em, created_at)) = $1
      ORDER BY atualizado_em DESC NULLS LAST, created_at DESC
      LIMIT 1
    `
    const res = await client.query(query, [day])
    let row: any = res.rows?.[0] ?? null

    // Fallback por ENV específica do dia
    if (!row) {
      const envs = process.env as Record<string, string | undefined>
      const envKey = day === 16 ? 'NEXT_PUBLIC_REPRISE_16_URL' : day === 17 ? 'NEXT_PUBLIC_REPRISE_17_URL' : undefined
      const fallbackUrl = (envKey && envs[envKey]) || ''
      const url = safeUrl(fallbackUrl)
      if (url) {
        const now = new Date().toISOString()
        row = {
          id: `env-reprise-${day}`,
          tipo: 'reprise',
          url,
          ativo_em: now,
          atualizado_em: now,
          created_at: now,
        }
      }
    }

    const reprise = row
      ? {
          id: String(row.id),
          tipo: String(row.tipo),
          url: safeUrl(row.url),
          ativo_em: row.ativo_em || null,
          atualizado_em: row.atualizado_em || row.updated_at || null,
          created_at: row.created_at || null,
        }
      : null

    return NextResponse.json({ reprise })
  } catch (error) {
    console.error(`GET /api/reprise/${day} error:`, error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  } finally {
    try {
      await client.end()
    } catch {}
  }
}
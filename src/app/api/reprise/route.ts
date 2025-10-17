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

export async function GET() {
  const client = createPgClient()
  try {
    await client.connect()

    // Most recent explicit 'reprise' link
    const repriseRes = await client.query(
      `SELECT id, tipo, url, ativo_em, atualizado_em, created_at
       FROM links
       WHERE tipo = 'reprise'
       ORDER BY atualizado_em DESC NULLS LAST, created_at DESC
       LIMIT 1`
    )

    let row: any = repriseRes.rows?.[0] ?? null

    // Fallback: if no 'reprise', try a previous 'transmissao' entry
    if (!row) {
      const transRes = await client.query(
        `SELECT id, tipo, url, ativo_em, atualizado_em, created_at
         FROM links
         WHERE tipo = 'transmissao'
         ORDER BY atualizado_em DESC NULLS LAST, created_at DESC
         OFFSET 1
         LIMIT 1`
      )
      row = transRes.rows?.[0] ?? null
    }

    // Fallback: environment variable
    if (!row) {
      const envUrl =
        process.env.NEXT_PUBLIC_FALLBACK_REPRISE_URL ||
        process.env.FALLBACK_REPRISE_URL ||
        process.env.NEXT_PUBLIC_FALLBACK_TRANSMISSAO_URL ||
        process.env.FALLBACK_TRANSMISSAO_URL ||
        ''
      const url = safeUrl(envUrl)
      if (url) {
        const now = new Date().toISOString()
        row = {
          id: 'env-reprise',
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
    console.error('GET /api/reprise error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  } finally {
    try {
      await client.end()
    } catch {}
  }
}
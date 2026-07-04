import { NextResponse } from 'next/server'
import { requireAuth, proxy } from '@/lib/api'

// POST /api/tickets/:id/comments  → adiciona andamento
export async function POST(req, { params }) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  if (!String(body?.body || '').trim()) {
    return NextResponse.json({ error: 'Escreva um comentário.' }, { status: 400 })
  }
  return proxy('POST', `/tickets/${encodeURIComponent(id)}/comments`, body)
}

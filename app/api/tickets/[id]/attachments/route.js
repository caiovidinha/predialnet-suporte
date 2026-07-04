import { NextResponse } from 'next/server'
import { requireAuth, proxy, apiServerForm } from '@/lib/api'

// GET /api/tickets/:id/attachments  → lista de anexos
export async function GET(_req, { params }) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { id } = await params
  return proxy('GET', `/tickets/${encodeURIComponent(id)}/attachments`)
}

// POST /api/tickets/:id/attachments  (multipart) → anexa arquivo
export async function POST(req, { params }) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { id } = await params
  const incoming = await req.formData().catch(() => null)
  if (!incoming || !incoming.get('file')) {
    return NextResponse.json({ error: 'Selecione um arquivo.' }, { status: 400 })
  }

  const res = await apiServerForm('POST', `/tickets/${encodeURIComponent(id)}/attachments`, incoming)
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}

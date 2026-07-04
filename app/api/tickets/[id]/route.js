import { NextResponse } from 'next/server'
import { requireAuth, proxy } from '@/lib/api'

// GET /api/tickets/:id  → detalhe (comments[] + attachments[])
export async function GET(_req, { params }) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { id } = await params
  return proxy('GET', `/tickets/${encodeURIComponent(id)}`)
}

// PATCH /api/tickets/:id  → atualiza/move no kanban
export async function PATCH(req, { params }) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  return proxy('PATCH', `/tickets/${encodeURIComponent(id)}`, body)
}

// DELETE /api/tickets/:id  → remove (soft delete)
export async function DELETE(_req, { params }) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { id } = await params
  return proxy('DELETE', `/tickets/${encodeURIComponent(id)}`)
}

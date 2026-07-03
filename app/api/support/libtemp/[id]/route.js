import { NextResponse } from 'next/server'
import { requireAuth, proxy } from '@/lib/api'

// DELETE /api/support/libtemp/:id  → remove a liberação temporária
export async function DELETE(_req, { params }) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { id } = await params
  const clean = String(id || '').trim()
  if (!clean) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 })
  }

  return proxy('DELETE', `/support/libtemp/${encodeURIComponent(clean)}`)
}

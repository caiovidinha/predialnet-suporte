import { requireAuth, proxy } from '@/lib/api'

// DELETE /api/tickets/:id/attachments/:attId  → remove anexo (bucket + banco)
export async function DELETE(_req, { params }) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { id, attId } = await params
  return proxy('DELETE', `/tickets/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attId)}`)
}

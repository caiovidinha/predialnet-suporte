import { requireAuth, proxy } from '@/lib/api'

// GET /api/tickets/:id/attachments/:attId/url  → URL temporária assinada
export async function GET(_req, { params }) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { id, attId } = await params
  return proxy('GET', `/tickets/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attId)}/url`)
}

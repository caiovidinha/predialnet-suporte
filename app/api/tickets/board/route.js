import { requireAuth, proxy } from '@/lib/api'

// GET /api/tickets/board  → colunas do kanban com os chamados
export async function GET() {
  const unauth = await requireAuth()
  if (unauth) return unauth

  return proxy('GET', '/tickets/board')
}

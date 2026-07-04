import { NextResponse } from 'next/server'
import { requireAuth, proxy } from '@/lib/api'

// GET /api/tickets?status=&priority=&assignee=&cpf=&q=&page=&limit=  → lista
export async function GET(req) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { searchParams } = new URL(req.url)
  const out = new URLSearchParams()
  for (const key of ['status', 'priority', 'assignee', 'cpf', 'q', 'page', 'limit']) {
    const value = searchParams.get(key)
    if (value) out.set(key, value)
  }
  const qs = out.toString()
  return proxy('GET', `/tickets${qs ? `?${qs}` : ''}`)
}

// POST /api/tickets  → abre chamado (operador autenticado)
export async function POST(req) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const body = await req.json().catch(() => ({}))
  const subject = String(body?.subject || '').trim()
  const description = String(body?.description || '').trim()
  if (!subject || !description) {
    return NextResponse.json({ error: 'Assunto e descrição são obrigatórios.' }, { status: 400 })
  }
  return proxy('POST', '/tickets', body)
}

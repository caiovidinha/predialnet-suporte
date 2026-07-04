import { NextResponse } from 'next/server'
import { proxy } from '@/lib/api'

// POST /api/public/tickets  → abertura de chamado SEM login (form standalone).
// Injeta o token do operador server-side; aceita apenas campos de criação.
export async function POST(req) {
  const body = await req.json().catch(() => ({}))
  const subject = String(body?.subject || '').trim()
  const description = String(body?.description || '').trim()
  if (!subject || !description) {
    return NextResponse.json({ error: 'Assunto e descrição são obrigatórios.' }, { status: 400 })
  }

  // Whitelist de campos — nada de status/position/assignee vindos de fora.
  const payload = {
    subject,
    description,
    priority: body?.priority || undefined,
    category: body?.category ? String(body.category).trim() : undefined,
    requesterName: body?.requesterName ? String(body.requesterName).trim() : undefined,
    cpf: body?.cpf ? String(body.cpf).replace(/\D/g, '') : undefined,
    codcliente: body?.codcliente ? String(body.codcliente).trim() : undefined,
  }

  return proxy('POST', '/tickets', payload)
}

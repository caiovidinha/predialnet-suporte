'use client'

import { createPublicTicket } from '@/lib/client'
import NewTicketForm from '@/components/NewTicketForm'

// Página standalone e pública de abertura de chamado.
// Sem AppShell, sem navegação e sem links para o restante do painel.
export default function ChamadoPublicoPage() {
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center text-center gap-2 mb-6">
          <img src="/img/logo.webp" alt="Predialnet" className="h-8 w-auto" />
          <h1 className="text-xl font-bold text-gray-900 mt-2">Abrir chamado de suporte</h1>
          <p className="text-sm text-gray-500">
            Descreva o problema e nossa equipe entrará em contato.
          </p>
        </div>

        <div className="bg-white border border-gray-200 p-5 shadow-sm">
          <NewTicketForm
            onSubmit={(payload) => createPublicTicket(payload)}
            submitLabel="Enviar chamado"
          />
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          Predialnet · Suporte
        </p>
      </div>
    </div>
  )
}

'use client'

import { priorityMeta, formatRelativeBR, maskCpf } from '@/lib/format'

export default function TicketCard({ ticket, onOpen, dragProps, dragging, dropBefore }) {
  const p = priorityMeta(ticket.priority)
  return (
    <div
      {...dragProps}
      onClick={() => onOpen?.(ticket)}
      className={`bg-white border px-3 py-2.5 cursor-pointer select-none transition ${
        dragging ? 'opacity-40' : 'hover:border-gray-300'
      } ${dropBefore ? 'border-t-2 border-t-[#9c0004]' : 'border-gray-200'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-400 tabular-nums">#{ticket.number}</span>
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium border ${p.cls}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
          {p.label}
        </span>
      </div>

      <p className="text-sm font-medium text-gray-900 mt-1 line-clamp-2">{ticket.subject}</p>

      <div className="flex items-center justify-between gap-2 mt-2 text-xs text-gray-400">
        <span className="truncate">
          {ticket.assignee ? ticket.assignee : (ticket.cpf ? maskCpf(ticket.cpf) : 'Sem responsável')}
        </span>
        <span className="whitespace-nowrap shrink-0">{formatRelativeBR(ticket.createdAt)}</span>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ticketsApi, ApiError } from '@/lib/client'
import { TICKET_STATUSES } from '@/lib/format'
import TicketCard from './TicketCard'
import TicketDetailModal from './TicketDetailModal'
import NewTicketForm from './NewTicketForm'

// Constrói o mapa status -> tickets a partir da resposta do /board,
// garantindo as 5 colunas mesmo que alguma venha ausente.
function toColumns(board) {
  const byStatus = {}
  for (const col of board?.columns || []) byStatus[col.status] = col.tickets || []
  return TICKET_STATUSES.map((s) => ({ status: s.key, label: s.label, tickets: byStatus[s.key] || [] }))
}

export default function TicketsBoard() {
  const router = useRouter()
  const [columns, setColumns] = useState(() => toColumns(null))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detailId, setDetailId] = useState(null)
  const [newOpen, setNewOpen] = useState(false)

  const [dragId, setDragId] = useState(null)
  const [dropAt, setDropAt] = useState(null) // { status, index }
  const dragFrom = useRef(null)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    ticketsApi.board()
      .then((b) => setColumns(toColumns(b)))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) { router.push('/login'); return }
        setError(err?.message || 'Erro ao carregar os chamados.')
      })
      .finally(() => setLoading(false))
  }, [router])

  useEffect(() => { load() }, [load])

  const total = columns.reduce((n, c) => n + c.tickets.length, 0)

  // ---- Drag & drop nativo ----
  function onDragStart(ticket, status) {
    setDragId(ticket.id)
    dragFrom.current = status
  }
  function onDragEnd() {
    setDragId(null)
    setDropAt(null)
    dragFrom.current = null
  }
  function overCard(e, status, index) {
    e.preventDefault()
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const after = e.clientY - rect.top > rect.height / 2
    setDropAt({ status, index: after ? index + 1 : index })
  }
  function overColumn(e, status, count) {
    e.preventDefault()
    if (!dropAt || dropAt.status !== status) setDropAt({ status, index: count })
  }

  async function drop(e, status) {
    e.preventDefault()
    const id = dragId
    const from = dragFrom.current
    const target = dropAt
    onDragEnd()
    if (!id || !target) return

    // Índice de destino (na coluna alvo, já sem o item arrastado se for a mesma).
    let index = target.index
    const next = columns.map((c) => ({ ...c, tickets: [...c.tickets] }))
    const srcCol = next.find((c) => c.status === from)
    const dstCol = next.find((c) => c.status === status)
    if (!srcCol || !dstCol) return
    const srcIdx = srcCol.tickets.findIndex((t) => t.id === id)
    if (srcIdx === -1) return
    const [moved] = srcCol.tickets.splice(srcIdx, 1)
    if (from === status && srcIdx < index) index -= 1
    dstCol.tickets.splice(index, 0, { ...moved, status })

    // Nada mudou de fato?
    if (from === status && srcIdx === index) return

    setColumns(next) // otimista
    try {
      await ticketsApi.update(id, { status, position: index })
    } catch (err) {
      setError(err?.message || 'Não foi possível mover o chamado.')
    } finally {
      load() // reconcilia com a ordem canônica do backend
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">Chamados</h1>
          <span className="text-sm text-gray-400">{total} no board</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} title="Atualizar" className="p-2 border border-gray-300 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button onClick={() => setNewOpen(true)} className="bg-[#9c0004] hover:bg-[#7a0003] text-white text-sm font-semibold px-4 py-2 transition cursor-pointer">
            + Novo chamado
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-red-700">{error}</span>
          <button onClick={load} className="text-sm font-medium text-[#9c0004] hover:underline cursor-pointer">Tentar novamente</button>
        </div>
      )}

      {/* Board */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {columns.map((col) => (
          <div
            key={col.status}
            onDragOver={(e) => overColumn(e, col.status, col.tickets.length)}
            onDrop={(e) => drop(e, col.status)}
            className="w-72 shrink-0 bg-gray-100 border border-gray-200 flex flex-col"
          >
            <div className="px-3 py-2 flex items-center justify-between border-b border-gray-200">
              <span className="text-sm font-semibold text-gray-700">{col.label}</span>
              <span className="text-xs text-gray-400 tabular-nums">{col.tickets.length}</span>
            </div>

            <div className="p-2 flex flex-col gap-2 min-h-24 flex-1">
              {loading && col.tickets.length === 0 ? (
                <div className="h-16 bg-gray-200/60 animate-pulse rounded" />
              ) : col.tickets.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Vazio</p>
              ) : (
                col.tickets.map((ticket, i) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onOpen={(t) => setDetailId(t.id)}
                    dragging={dragId === ticket.id}
                    dropBefore={dropAt?.status === col.status && dropAt?.index === i}
                    dragProps={{
                      draggable: true,
                      onDragStart: () => onDragStart(ticket, col.status),
                      onDragEnd,
                      onDragOver: (e) => overCard(e, col.status, i),
                      onDrop: (e) => drop(e, col.status),
                    }}
                  />
                ))
              )}
              {/* Indicador de drop no fim da coluna */}
              {dropAt?.status === col.status && dropAt?.index === col.tickets.length && col.tickets.length > 0 && (
                <div className="h-0.5 bg-[#9c0004]" />
              )}
            </div>
          </div>
        ))}
      </div>

      {detailId && (
        <TicketDetailModal ticketId={detailId} onClose={() => setDetailId(null)} onChanged={load} />
      )}

      {newOpen && (
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/40 p-4 overflow-y-auto" onClick={() => setNewOpen(false)}>
          <div className="bg-white w-full max-w-lg my-8 shadow-xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-gray-200 px-5 py-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Novo chamado</h2>
              <button onClick={() => setNewOpen(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer text-xl leading-none px-2">×</button>
            </div>
            <div className="p-5">
              <NewTicketForm
                onSubmit={(payload) => ticketsApi.create(payload)}
                onCreated={() => { load() }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

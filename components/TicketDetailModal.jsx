'use client'

import { useState, useEffect, useCallback } from 'react'
import { ticketsApi, ApiError } from '@/lib/client'
import {
  TICKET_STATUSES, TICKET_PRIORITIES, priorityMeta, statusLabel,
  formatDateTimeBR, formatRelativeBR, formatBytes, maskCpf, DASH,
} from '@/lib/format'

export default function TicketDetailModal({ ticketId, onClose, onChanged }) {
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [commentBody, setCommentBody] = useState('')
  const [commentInternal, setCommentInternal] = useState(true)
  const [commenting, setCommenting] = useState(false)

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    ticketsApi.get(ticketId)
      .then(setTicket)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Erro ao carregar o chamado.'))
      .finally(() => setLoading(false))
  }, [ticketId])

  useEffect(() => { load() }, [load])

  async function patch(fields) {
    setSaving(true)
    try {
      const updated = await ticketsApi.update(ticketId, fields)
      setTicket((t) => ({ ...t, ...updated }))
      onChanged?.()
    } catch (err) {
      setError(err?.message || 'Não foi possível atualizar.')
    } finally {
      setSaving(false)
    }
  }

  async function addComment() {
    const body = commentBody.trim()
    if (!body) return
    setCommenting(true)
    try {
      await ticketsApi.addComment(ticketId, { body, internal: commentInternal })
      setCommentBody('')
      load()
    } catch (err) {
      setError(err?.message || 'Não foi possível comentar.')
    } finally {
      setCommenting(false)
    }
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setUploadError('')
    try {
      await ticketsApi.uploadAttachment(ticketId, file)
      load()
    } catch (err) {
      if (err instanceof ApiError && err.status === 413) setUploadError('Arquivo acima de 25 MB.')
      else if (err instanceof ApiError && err.status === 503) setUploadError('Armazenamento não configurado no servidor.')
      else setUploadError(err?.message || 'Falha no upload.')
    } finally {
      setUploading(false)
    }
  }

  async function downloadAttachment(att) {
    try {
      const { url } = await ticketsApi.attachmentUrl(ticketId, att.id)
      if (url) window.open(url, '_blank', 'noopener')
    } catch {
      setError('Não foi possível gerar o link de download.')
    }
  }

  async function removeAttachment(att) {
    try {
      await ticketsApi.removeAttachment(ticketId, att.id)
      load()
    } catch (err) {
      setError(err?.message || 'Não foi possível remover o anexo.')
    }
  }

  async function removeTicket() {
    if (!confirm('Remover este chamado do board?')) return
    try {
      await ticketsApi.remove(ticketId)
      onChanged?.()
      onClose?.()
    } catch (err) {
      setError(err?.message || 'Não foi possível remover.')
    }
  }

  const comments = ticket?.comments || []
  const attachments = ticket?.attachments || []
  const selectCls = 'border border-gray-300 px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#9c0004] cursor-pointer'

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/40 p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-[#f5f5f5] w-full max-w-2xl my-8 shadow-xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between sticky top-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm text-gray-400 tabular-nums">#{ticket?.number ?? '—'}</span>
            <h2 className="text-base font-semibold text-gray-900 truncate">{ticket?.subject || 'Chamado'}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 cursor-pointer text-xl leading-none px-2">×</button>
        </div>

        {loading ? (
          <div className="p-6"><div className="h-40 bg-gray-100 animate-pulse rounded" /></div>
        ) : error && !ticket ? (
          <div className="p-6 text-sm text-red-700">{error}</div>
        ) : ticket ? (
          <div className="p-5 flex flex-col gap-4">
            {error && <p className="text-sm text-red-700">{error}</p>}

            {/* Controles rápidos */}
            <div className="flex flex-wrap items-center gap-2">
              <select value={ticket.status} disabled={saving} onChange={(e) => patch({ status: e.target.value })} className={selectCls}>
                {TICKET_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <select value={ticket.priority} disabled={saving} onChange={(e) => patch({ priority: e.target.value })} className={selectCls}>
                {TICKET_PRIORITIES.map((p) => <option key={p} value={p}>{priorityMeta(p).label}</option>)}
              </select>
              <input
                defaultValue={ticket.assignee || ''}
                onBlur={(e) => { const v = e.target.value.trim(); if (v !== (ticket.assignee || '')) patch({ assignee: v || null }) }}
                placeholder="Responsável"
                className="border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#9c0004]"
              />
              <button onClick={removeTicket} className="ml-auto text-sm text-red-600 hover:underline cursor-pointer">
                Remover
              </button>
            </div>

            {/* Descrição */}
            <div className="bg-white border border-gray-200 p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.description || DASH}</p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-400">
                {ticket.category && <span>Categoria: {ticket.category}</span>}
                {ticket.requesterName && <span>Aberto por: {ticket.requesterName}</span>}
                {ticket.cpf && <span>CPF: {maskCpf(ticket.cpf)}</span>}
                {ticket.codcliente && <span>Contrato: #{ticket.codcliente}</span>}
                <span>Criado {formatRelativeBR(ticket.createdAt)}</span>
                {ticket.closedAt && <span>Fechado em {formatDateTimeBR(ticket.closedAt)}</span>}
              </div>
            </div>

            {/* Anexos */}
            <div className="bg-white border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Anexos</span>
                <label className="text-sm font-medium text-[#9c0004] hover:underline cursor-pointer">
                  {uploading ? 'Enviando...' : '+ Anexar'}
                  <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>
              </div>
              {uploadError && <p className="text-xs text-red-700 mb-2">{uploadError}</p>}
              {attachments.length === 0 ? (
                <p className="text-xs text-gray-400">Nenhum anexo.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-gray-100">
                  {attachments.map((att) => (
                    <li key={att.id} className="flex items-center justify-between gap-2 py-2">
                      <button onClick={() => downloadAttachment(att)} className="text-sm text-gray-700 hover:text-[#9c0004] hover:underline truncate cursor-pointer text-left">
                        {att.filename}
                      </button>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-gray-400 tabular-nums">{formatBytes(att.size)}</span>
                        <button onClick={() => removeAttachment(att)} className="text-xs text-red-600 hover:underline cursor-pointer">Remover</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Comentários */}
            <div className="bg-white border border-gray-200 p-4">
              <span className="text-sm font-medium text-gray-700">Andamento</span>
              <div className="mt-3 flex flex-col gap-3">
                {comments.length === 0 ? (
                  <p className="text-xs text-gray-400">Nenhum comentário ainda.</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className={`border px-3 py-2 ${c.internal ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-gray-700">{c.author || 'Operador'}</span>
                        <div className="flex items-center gap-2">
                          {c.internal && <span className="text-[11px] text-amber-700 border border-amber-200 px-1 py-0.5">Interno</span>}
                          <span className="text-xs text-gray-400">{formatRelativeBR(c.createdAt)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{c.body}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-3 flex flex-col gap-2">
                <textarea
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  rows={2}
                  placeholder="Adicionar andamento..."
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9c0004] resize-y"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
                    <input type="checkbox" checked={commentInternal} onChange={(e) => setCommentInternal(e.target.checked)} />
                    Comentário interno (não exibir ao cliente)
                  </label>
                  <button
                    onClick={addComment}
                    disabled={commenting || !commentBody.trim()}
                    className="bg-[#9c0004] hover:bg-[#7a0003] text-white text-sm font-medium px-4 py-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {commenting ? 'Enviando...' : 'Comentar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

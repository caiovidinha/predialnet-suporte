'use client'

import { useState } from 'react'
import { TICKET_PRIORITIES, priorityMeta } from '@/lib/format'

const EMPTY = {
  subject: '',
  description: '',
  priority: 'MEDIA',
  category: '',
  requesterName: '',
  cpf: '',
  codcliente: '',
}

/**
 * Formulário de abertura de chamado, reaproveitado no modal do painel e na
 * página pública. `onSubmit(payload)` deve devolver o ticket criado (ou lançar).
 */
export default function NewTicketForm({ onSubmit, initial, onCreated, submitLabel = 'Abrir chamado' }) {
  const [values, setValues] = useState({ ...EMPTY, ...initial })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)

  function set(key, value) {
    setValues((v) => ({ ...v, [key]: value }))
    setError('')
  }

  async function submit(e) {
    e?.preventDefault()
    if (!values.subject.trim() || !values.description.trim()) {
      setError('Preencha assunto e descrição.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        subject: values.subject.trim(),
        description: values.description.trim(),
        priority: values.priority,
        category: values.category.trim() || undefined,
        requesterName: values.requesterName.trim() || undefined,
        cpf: values.cpf.replace(/\D/g, '') || undefined,
        codcliente: values.codcliente.trim() || undefined,
      }
      const ticket = await onSubmit(payload)
      setCreated(ticket || {})
      onCreated?.(ticket)
    } catch (err) {
      setError(err?.message || 'Não foi possível abrir o chamado.')
    } finally {
      setSaving(false)
    }
  }

  if (created) {
    return (
      <div className="flex flex-col items-center text-center gap-3 py-6">
        <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-gray-900 font-semibold">Chamado aberto com sucesso!</p>
          {created.number != null && (
            <p className="text-sm text-gray-500 mt-0.5">Protocolo #{created.number}</p>
          )}
        </div>
        <button
          onClick={() => { setCreated(null); setValues({ ...EMPTY, ...initial }) }}
          className="text-sm font-medium text-[#9c0004] hover:underline cursor-pointer"
        >
          Abrir outro chamado
        </button>
      </div>
    )
  }

  const inputCls = 'w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#9c0004] focus:border-transparent'

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Assunto *</label>
        <input
          value={values.subject}
          onChange={(e) => set('subject', e.target.value)}
          placeholder="Ex.: Sem internet"
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Descrição *</label>
        <textarea
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          rows={4}
          placeholder="Descreva o problema do cliente"
          className={`${inputCls} resize-y`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Prioridade</label>
          <select value={values.priority} onChange={(e) => set('priority', e.target.value)} className={`${inputCls} bg-white cursor-pointer`}>
            {TICKET_PRIORITIES.map((p) => (
              <option key={p} value={p}>{priorityMeta(p).label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
          <input value={values.category} onChange={(e) => set('category', e.target.value)} placeholder="Ex.: Conexão" className={inputCls} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Quem está abrindo</label>
        <input value={values.requesterName} onChange={(e) => set('requesterName', e.target.value)} placeholder="Nome do operador" className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">CPF do cliente</label>
          <input value={values.cpf} onChange={(e) => set('cpf', e.target.value)} inputMode="numeric" placeholder="Opcional" className={`${inputCls} tabular-nums`} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Contrato (codcliente)</label>
          <input value={values.codcliente} onChange={(e) => set('codcliente', e.target.value)} placeholder="Opcional" className={`${inputCls} tabular-nums`} />
        </div>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="bg-[#9c0004] hover:bg-[#7a0003] text-white font-semibold px-6 py-2.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed self-start"
      >
        {saving ? 'Enviando...' : submitLabel}
      </button>
    </form>
  )
}

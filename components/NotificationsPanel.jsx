'use client'

import { useState, useEffect, useCallback } from 'react'
import { supportApi, ApiError } from '@/lib/client'
import { formatDateTimeBR, DASH } from '@/lib/format'

function Counter({ label, value, tone }) {
  const tones = { amber: 'text-amber-700', gray: 'text-gray-900' }
  return (
    <div className="bg-white border border-gray-200 px-4 py-3">
      <span className="text-xs text-gray-500">{label}</span>
      <p className={`text-2xl font-bold tabular-nums ${tones[tone] || tones.gray}`}>{value ?? 0}</p>
    </div>
  )
}

export default function NotificationsPanel({ cpf }) {
  const cpfOk = String(cpf || '').length === 11
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    if (!cpfOk) return
    let active = true
    setLoading(true)
    setError('')
    supportApi.notifications(cpf)
      .then((d) => { if (active) setData(d) })
      .catch((err) => {
        if (!active) return
        setError(err instanceof ApiError ? err.message : 'Erro ao carregar as notificações.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [cpf, cpfOk])

  useEffect(() => load(), [load])

  if (!cpfOk) {
    return (
      <div className="bg-white border border-gray-200 px-4 py-10 text-center text-sm text-gray-400">
        Sem CPF do cliente para consultar notificações.
      </div>
    )
  }

  if (loading && !data) {
    return (
      <div className="bg-white border border-gray-200 p-4">
        <div className="h-4 w-40 bg-gray-100 animate-pulse rounded" />
        <div className="mt-3 h-40 bg-gray-100 animate-pulse rounded" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-red-700">{error}</span>
        <button onClick={load} className="text-sm font-medium text-[#9c0004] hover:underline cursor-pointer">
          Tentar novamente
        </button>
      </div>
    )
  }

  const list = Array.isArray(data?.notifications) ? data.notifications : []

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Counter label="Total recebidas" value={data?.total} tone="gray" />
        <Counter label="Não lidas" value={data?.unread} tone="amber" />
      </div>

      <div className="bg-white border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Notificações</span>
          <button
            onClick={load}
            title="Atualizar"
            className="text-gray-400 hover:text-gray-700 transition cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {list.length === 0 ? (
          <p className="text-sm text-gray-400 px-4 py-8 text-center">Nenhuma notificação recebida.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {list.map((n, i) => (
              <li key={n.id || i} className={`px-4 py-3 flex gap-3 ${n.read ? '' : 'bg-[#9c0004]/[0.03]'}`}>
                <span
                  className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read ? 'bg-gray-200' : 'bg-[#9c0004]'}`}
                  title={n.read ? 'Lida' : 'Não lida'}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${n.read ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                      {n.title || DASH}
                    </p>
                    <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                      {formatDateTimeBR(n.receivedAt || n.sentAt)}
                    </span>
                  </div>
                  {n.body && <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    {n.read ? (
                      <span className="text-xs text-gray-400">
                        Lida{n.readAt ? ` em ${formatDateTimeBR(n.readAt)}` : ''}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-[#9c0004]">Não lida</span>
                    )}
                    {n.data?.screen && (
                      <span className="text-xs text-gray-400 border border-gray-200 px-1.5 py-0.5">
                        {n.data.screen}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

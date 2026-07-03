'use client'

import { useState } from 'react'
import { formatBRL, formatDateBR, DASH } from '@/lib/format'
import { Pill, paymentTone } from './StatusPanel'

// Deriva rótulo/tom de uma fatura do history (que traz campos crus da UAIPI).
function invoiceStatus(inv) {
  if (inv?.cancelada === true || String(inv?.cancelada).toLowerCase() === 'true') {
    return { label: 'Cancelada', tone: 'gray' }
  }
  if (inv?.dta_pagamento) return { label: 'Paga', tone: 'green' }
  const venc = inv?.dta_vencimento || inv?.vencimento
  if (venc) {
    const d = parseVenc(venc)
    if (d && d.getTime() < startOfToday()) return { label: 'Atrasada', tone: 'red' }
  }
  return { label: 'Em aberto', tone: 'amber' }
}

function parseVenc(v) {
  const s = String(v)
  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (br) return new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]))
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function CopyPix({ pix }) {
  const [copied, setCopied] = useState(false)
  if (!pix) return <span className="text-gray-300">{DASH}</span>
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(String(pix))
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch { /* clipboard indisponível */ }
      }}
      className="text-[#9c0004] hover:underline text-xs font-medium cursor-pointer"
    >
      {copied ? 'Copiado!' : 'Copiar Pix'}
    </button>
  )
}

function Counter({ label, value, tone }) {
  const tones = {
    amber: 'text-amber-700',
    red: 'text-red-700',
    gray: 'text-gray-900',
  }
  return (
    <div className="bg-white border border-gray-200 px-4 py-3">
      <span className="text-xs text-gray-500">{label}</span>
      <p className={`text-2xl font-bold tabular-nums ${tones[tone] || tones.gray}`}>{value ?? 0}</p>
    </div>
  )
}

export default function InvoicesPanel({ invoices, loading }) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 p-4">
        <div className="h-4 w-32 bg-gray-100 animate-pulse rounded" />
        <div className="mt-3 h-40 bg-gray-100 animate-pulse rounded" />
      </div>
    )
  }
  if (!invoices) return null

  const history = Array.isArray(invoices.history) ? invoices.history : []
  const current = invoices.current || null
  const past = invoices.pastStatus || {}

  return (
    <div className="flex flex-col gap-3">
      {/* Contadores */}
      <div className="grid grid-cols-2 gap-3">
        <Counter label="Faturas em aberto" value={past.open} tone="amber" />
        <Counter label="Faturas atrasadas" value={past.overdue} tone="red" />
      </div>

      {/* Fatura atual em destaque */}
      {current && (
        <div className="bg-white border-2 border-[#9c0004]/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs text-gray-500">Fatura atual</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-gray-900 tabular-nums">{formatBRL(current.valor)}</span>
                <Pill tone={paymentTone(current.status)}>{current.status || DASH}</Pill>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Vencimento {formatDateBR(current.vencimento)}
                {current.boleta ? ` · Boleto ${current.boleta}` : ''}
              </p>
            </div>
            {current.link && (
              <a
                href={current.link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#9c0004] hover:bg-[#7a0003] text-white text-sm font-medium px-4 py-2 transition cursor-pointer"
              >
                2ª via
              </a>
            )}
          </div>
        </div>
      )}

      {/* Histórico */}
      <div className="bg-white border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700">Histórico de faturas</span>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400 px-4 py-6 text-center">Nenhuma fatura no histórico.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                  <th className="px-4 py-2 font-medium">Vencimento</th>
                  <th className="px-4 py-2 font-medium">Valor</th>
                  <th className="px-4 py-2 font-medium">Pagamento</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium text-right">2ª via</th>
                  <th className="px-4 py-2 font-medium text-right">Pix</th>
                </tr>
              </thead>
              <tbody>
                {history.map((inv, i) => {
                  const st = invoiceStatus(inv)
                  return (
                    <tr key={inv.boleta || i} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-2.5 tabular-nums text-gray-700">
                        {formatDateBR(inv.dta_vencimento || inv.vencimento)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-gray-900 font-medium">{formatBRL(inv.valor)}</td>
                      <td className="px-4 py-2.5 tabular-nums text-gray-500">
                        {inv.dta_pagamento ? formatDateBR(inv.dta_pagamento) : DASH}
                      </td>
                      <td className="px-4 py-2.5"><Pill tone={st.tone}>{st.label}</Pill></td>
                      <td className="px-4 py-2.5 text-right">
                        {inv.link ? (
                          <a href={inv.link} target="_blank" rel="noopener noreferrer" className="text-[#9c0004] hover:underline text-xs font-medium">
                            Abrir
                          </a>
                        ) : <span className="text-gray-300">{DASH}</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right"><CopyPix pix={inv.pix} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

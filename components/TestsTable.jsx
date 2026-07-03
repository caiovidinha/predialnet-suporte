'use client'

import StatusBadge from './StatusBadge'
import {
  formatDateTimeBR, formatMbps, formatMs,
  connectionLabel, platformLabel, DASH,
} from '@/lib/format'

function deviceLabel(t) {
  const model = t.deviceModel
  const plat = platformLabel(t.platform)
  if (model && plat !== DASH) return `${model} · ${plat}`
  return model || (plat !== DASH ? plat : DASH)
}

function HeadCell({ children, className = '' }) {
  return (
    <th className={`text-left font-medium text-gray-500 px-3 py-2 whitespace-nowrap ${className}`}>
      {children}
    </th>
  )
}

export default function TestsTable({ items, loading, onSelect }) {
  return (
    <div className="bg-white border border-gray-200 overflow-x-auto">
      <table className="w-full text-sm min-w-[820px]">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <HeadCell>Data/hora</HeadCell>
            <HeadCell className="text-right">Download</HeadCell>
            <HeadCell className="text-right">Upload</HeadCell>
            <HeadCell className="text-right">Ping</HeadCell>
            <HeadCell className="text-right">Jitter</HeadCell>
            <HeadCell>Conexão</HeadCell>
            <HeadCell>Dispositivo</HeadCell>
            <HeadCell>Status</HeadCell>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-100">
                {Array.from({ length: 8 }).map((__, j) => (
                  <td key={j} className="px-3 py-3">
                    <span className="block h-4 bg-gray-100 animate-pulse rounded" />
                  </td>
                ))}
              </tr>
            ))
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-3 py-16 text-center text-gray-500">
                Nenhum teste encontrado para este CPF.
              </td>
            </tr>
          ) : (
            items.map((t) => (
              <tr
                key={t.id}
                onClick={() => onSelect(t)}
                className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition"
              >
                <td className="px-3 py-2.5 whitespace-nowrap text-gray-700">{formatDateTimeBR(t.createdAt)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-900">{formatMbps(t.downloadMbps, { suffix: false })}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-900">{formatMbps(t.uploadMbps, { suffix: false })}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{formatMs(t.pingMs, { suffix: false })}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{formatMs(t.jitterMs, { suffix: false })}</td>
                <td className="px-3 py-2.5 whitespace-nowrap text-gray-700">{connectionLabel(t.connectionType)}</td>
                <td className="px-3 py-2.5 whitespace-nowrap text-gray-700">{deviceLabel(t)}</td>
                <td className="px-3 py-2.5"><StatusBadge status={t.status} /></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import { formatMbps, formatDateTimeBR } from '@/lib/format'

const BRAND = '#9c0004'
const W = 760
const H = 220
const PAD = { top: 16, right: 16, bottom: 28, left: 44 }

export default function DownloadChart({ items }) {
  const [hover, setHover] = useState(null)

  const points = useMemo(() => {
    const rows = (items || [])
      .filter((t) => typeof t.downloadMbps === 'number' && t.createdAt)
      .map((t) => ({ t: new Date(t.createdAt).getTime(), v: t.downloadMbps, iso: t.createdAt }))
      .sort((a, b) => a.t - b.t)
    return rows
  }, [items])

  if (points.length < 2) {
    return (
      <div className="bg-white border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-1">Download ao longo do tempo</h3>
        <div className="flex items-center justify-center h-32 text-sm text-gray-400">
          Dados insuficientes para o gráfico.
        </div>
      </div>
    )
  }

  const tMin = points[0].t
  const tMax = points[points.length - 1].t
  const vMax = Math.max(...points.map((p) => p.v)) * 1.1
  const vMin = 0
  const spanT = tMax - tMin || 1
  const spanV = vMax - vMin || 1

  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const x = (t) => PAD.left + ((t - tMin) / spanT) * plotW
  const y = (v) => PAD.top + (1 - (v - vMin) / spanV) * plotH

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')

  // Ticks do eixo Y (4 linhas horizontais recessivas)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((r) => ({
    v: vMin + r * spanV,
    yy: PAD.top + (1 - r) * plotH,
  }))

  return (
    <div className="bg-white border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Download ao longo do tempo (Mbps)</h3>
      <div className="relative w-full">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Download em Mbps ao longo do tempo">
          {/* grid + labels Y */}
          {yTicks.map((tk, i) => (
            <g key={i}>
              <line x1={PAD.left} x2={W - PAD.right} y1={tk.yy} y2={tk.yy} stroke="#f0f0f0" strokeWidth="1" />
              <text x={PAD.left - 8} y={tk.yy + 3} textAnchor="end" className="fill-gray-400" fontSize="10">
                {Math.round(tk.v)}
              </text>
            </g>
          ))}
          {/* labels X (primeiro e último) */}
          <text x={PAD.left} y={H - 8} textAnchor="start" className="fill-gray-400" fontSize="10">
            {formatDateTimeBR(points[0].iso)}
          </text>
          <text x={W - PAD.right} y={H - 8} textAnchor="end" className="fill-gray-400" fontSize="10">
            {formatDateTimeBR(points[points.length - 1].iso)}
          </text>

          {/* linha (série única, cor da marca) */}
          <path d={path} fill="none" stroke={BRAND} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

          {/* pontos + alvos de hover */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={x(p.t)} cy={y(p.v)} r="2.5" fill={BRAND} />
              <circle
                cx={x(p.t)}
                cy={y(p.v)}
                r="12"
                fill="transparent"
                onMouseEnter={() => setHover({ i, xr: x(p.t) / W, yr: y(p.v) / H, p })}
                onMouseLeave={() => setHover((h) => (h?.i === i ? null : h))}
                style={{ cursor: 'pointer' }}
              />
              {hover?.i === i && (
                <circle cx={x(p.t)} cy={y(p.v)} r="4" fill={BRAND} stroke="#fff" strokeWidth="1.5" />
              )}
            </g>
          ))}
        </svg>

        {hover && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full mb-2 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap"
            style={{ left: `${hover.xr * 100}%`, top: `${hover.yr * 100}%` }}
          >
            <div className="font-semibold tabular-nums">{formatMbps(hover.p.v)}</div>
            <div className="text-gray-300">{formatDateTimeBR(hover.p.iso)}</div>
          </div>
        )}
      </div>
    </div>
  )
}

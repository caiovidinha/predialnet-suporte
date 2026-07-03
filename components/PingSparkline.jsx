'use client'

// Sparkline das amostras de ping. Série única, sem eixos — leitura de forma.
const BRAND = '#9c0004'

export default function PingSparkline({ samples, width = 240, height = 48 }) {
  const nums = (samples || []).filter((n) => typeof n === 'number' && !Number.isNaN(n))
  if (nums.length < 2) {
    return <span className="text-sm text-gray-400">Sem amostras suficientes.</span>
  }

  const min = Math.min(...nums)
  const max = Math.max(...nums)
  const span = max - min || 1
  const pad = 4
  const w = width - pad * 2
  const h = height - pad * 2
  const x = (i) => pad + (i / (nums.length - 1)) * w
  const y = (v) => pad + (1 - (v - min) / span) * h

  const path = nums.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = `${path} L${x(nums.length - 1).toFixed(1)},${height - pad} L${x(0).toFixed(1)},${height - pad} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[280px] h-auto" role="img" aria-label="Amostras de ping">
      <path d={area} fill={BRAND} fillOpacity="0.08" />
      <path d={path} fill="none" stroke={BRAND} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

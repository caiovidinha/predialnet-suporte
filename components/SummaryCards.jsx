import { formatMbps, formatMs, formatNumber, formatDateTimeBR, DASH } from '@/lib/format'

function Tile({ label, value, sub, loading }) {
  return (
    <div className="bg-white border border-gray-200 px-4 py-4 flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      {loading ? (
        <span className="mt-2 h-6 w-20 bg-gray-100 animate-pulse rounded" />
      ) : (
        <>
          <span className="mt-1 text-2xl font-bold text-gray-900 tabular-nums leading-tight">
            {value}
          </span>
          {sub && <span className="text-xs text-gray-400 mt-0.5">{sub}</span>}
        </>
      )}
    </div>
  )
}

export default function SummaryCards({ summary, loading }) {
  const a = summary?.averages || {}
  const best = summary?.best || {}

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      <Tile
        loading={loading}
        label="Total de testes"
        value={loading ? null : formatNumber(summary?.totalTests ?? 0)}
      />
      <Tile
        loading={loading}
        label="Média de download"
        value={formatMbps(a.downloadMbps)}
      />
      <Tile
        loading={loading}
        label="Média de upload"
        value={formatMbps(a.uploadMbps)}
      />
      <Tile
        loading={loading}
        label="Média de ping"
        value={formatMs(a.pingMs)}
        sub={a.jitterMs != null ? `Jitter ${formatMs(a.jitterMs)}` : null}
      />
      <Tile
        loading={loading}
        label="Melhor download"
        value={formatMbps(best.downloadMbps)}
        sub={best.uploadMbps != null ? `Upload ${formatMbps(best.uploadMbps)}` : null}
      />
      <Tile
        loading={loading}
        label="Último teste"
        value={summary?.lastTest?.createdAt ? formatDateTimeBR(summary.lastTest.createdAt) : DASH}
      />
    </div>
  )
}

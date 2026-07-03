import { formatBRL, formatDateBR, DASH } from '@/lib/format'

// Normaliza o texto de status de pagamento para um tom de cor.
export function paymentTone(status) {
  const s = String(status || '').toLowerCase()
  if (s.includes('paga') || s.includes('pago')) return 'green'
  if (s.includes('atras') || s.includes('vencid')) return 'red'
  if (s.includes('aberto')) return 'amber'
  return 'gray'
}

const TONES = {
  green: 'bg-green-50 text-green-700 border-green-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
}

export function Pill({ children, tone = 'gray' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border ${TONES[tone]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}

function connectionTone(status) {
  const s = String(status || '').toLowerCase()
  if (s.includes('conect') && !s.includes('desconect')) return 'green'
  if (s.includes('desconect') || s.includes('bloque') || s.includes('suspens')) return 'red'
  return 'gray'
}

export default function StatusPanel({ status, loading }) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 p-4">
        <div className="h-4 w-40 bg-gray-100 animate-pulse rounded" />
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-20 bg-gray-100 animate-pulse rounded" />)}
        </div>
      </div>
    )
  }
  if (!status) return null

  const pontos = Array.isArray(status.service_status) ? status.service_status : []
  const pay = status.payment_status || null
  const libtemp = status.libtemp_status === true

  return (
    <div className="flex flex-col gap-3">
      {/* Conexão por serponto */}
      <div className="bg-white border border-gray-200 p-4">
        <span className="text-sm font-medium text-gray-700">Conexão</span>
        {pontos.length === 0 ? (
          <p className="text-sm text-gray-400 mt-2">Sem pontos de serviço retornados.</p>
        ) : (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pontos.map((p, i) => (
              <div key={p.id_ponto ?? i} className="border border-gray-200 px-3.5 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Ponto {p.id_ponto ?? DASH}</span>
                  <Pill tone={connectionTone(p.status_conexao)}>{p.status_conexao || DASH}</Pill>
                </div>
                <p className="mt-2 text-lg font-bold text-gray-900">{p.velocidade || DASH}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagamento + liberação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white border border-gray-200 px-4 py-4">
          <span className="text-xs text-gray-500">Pagamento</span>
          {pay ? (
            <>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900 tabular-nums">{formatBRL(pay.valor)}</span>
                <Pill tone={paymentTone(pay.status)}>{pay.status || DASH}</Pill>
              </div>
              <p className="text-xs text-gray-400 mt-1">Vencimento {formatDateBR(pay.vencimento)}</p>
            </>
          ) : (
            <p className="text-sm text-gray-400 mt-2">Sem informação de pagamento.</p>
          )}
        </div>

        <div className="bg-white border border-gray-200 px-4 py-4">
          <span className="text-xs text-gray-500">Liberação temporária</span>
          <div className="mt-2">
            {libtemp ? (
              <Pill tone="amber">Ativa</Pill>
            ) : (
              <Pill tone="gray">Inativa</Pill>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { maskCpf, DASH } from '@/lib/format'

function Badge({ children, tone = 'gray' }) {
  const tones = {
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    gray: 'bg-gray-100 text-gray-600 border-gray-200',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border ${tones[tone]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}

export default function ClientHeader({ overview, loading }) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 p-5">
        <div className="h-6 w-48 bg-gray-100 animate-pulse rounded" />
        <div className="mt-3 h-4 w-64 bg-gray-100 animate-pulse rounded" />
      </div>
    )
  }
  if (!overview) return null

  const isClient = overview.isClient?.isClient === true
  const nome = overview.isClient?.nome || DASH
  const cpf = overview.isClient?.cpf || overview.appAccount?.cpf || overview.credential
  const email = overview.isClient?.email || overview.appAccount?.email || DASH
  const app = overview.appAccount || {}
  const contratos = overview.isClient?.contratos

  return (
    <div className="bg-white border border-gray-200 p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 leading-tight">{nome}</h2>
          <p className="text-sm text-gray-500 tabular-nums mt-0.5">
            {cpf && String(cpf).length === 11 ? maskCpf(cpf) : (cpf || DASH)}
          </p>
          <p className="text-sm text-gray-500 mt-0.5 break-all">{email}</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          {isClient ? (
            <Badge tone="green">
              Cliente Predialnet{contratos != null ? ` · ${contratos} contrato${contratos === 1 ? '' : 's'}` : ''}
            </Badge>
          ) : (
            <Badge tone="gray">Não é cliente</Badge>
          )}
          {app.exists ? (
            <Badge tone="green">Conta do app ativa</Badge>
          ) : (
            <Badge tone="gray">Sem conta do app</Badge>
          )}
          {app.exists && app.mustChangePassword && (
            <Badge tone="amber">Precisa trocar senha</Badge>
          )}
        </div>
      </div>
    </div>
  )
}

import { extractCodcliente, DASH } from '@/lib/format'

function enderecoResumo(endereco) {
  if (!endereco || typeof endereco !== 'object') return null
  const rua = [endereco.logradouro || endereco.rua, endereco.numero].filter(Boolean).join(', ')
  const partes = [rua, endereco.bairro, endereco.cidade].filter(Boolean)
  return partes.length ? partes.join(' · ') : null
}

function situacaoTone(situacao) {
  const s = String(situacao || '').toLowerCase()
  if (s.includes('ativ')) return 'text-green-700 bg-green-50 border-green-200'
  if (s.includes('cancel') || s.includes('inativ') || s.includes('suspens')) return 'text-red-700 bg-red-50 border-red-200'
  return 'text-gray-600 bg-gray-100 border-gray-200'
}

export default function ContractSelector({ contratos = [], selected, onSelect, loading }) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 p-4">
        <div className="h-4 w-32 bg-gray-100 animate-pulse rounded" />
        <div className="mt-3 h-16 w-full bg-gray-100 animate-pulse rounded" />
      </div>
    )
  }
  if (!contratos.length) return null

  const single = contratos.length === 1

  return (
    <div className="bg-white border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700">
          {single ? 'Contrato' : 'Selecione um contrato'}
        </span>
        <span className="text-xs text-gray-400">
          {contratos.length} contrato{contratos.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {contratos.map((c, i) => {
          const cod = extractCodcliente(c)
          const isSel = cod && cod === selected
          const resumo = enderecoResumo(c.endereco)
          const planos = Array.isArray(c.planos) ? c.planos : []
          const disabled = !cod
          return (
            <button
              key={cod || i}
              type="button"
              disabled={disabled}
              onClick={() => cod && onSelect(cod)}
              className={`text-left border px-3.5 py-3 transition ${
                disabled
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  : isSel
                    ? 'border-[#9c0004] bg-[#9c0004]/5 cursor-pointer'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-gray-900 tabular-nums">
                  {cod ? `#${cod}` : 'codcliente indisponível'}
                </span>
                <div className="flex items-center gap-2">
                  {c.situacao && (
                    <span className={`text-[11px] font-medium px-1.5 py-0.5 border ${situacaoTone(c.situacao)}`}>
                      {c.situacao}
                    </span>
                  )}
                  {isSel && <span className="text-xs font-medium text-[#9c0004]">Selecionado</span>}
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-1">{resumo || DASH}</p>

              {planos.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  {planos.map((p, j) => (
                    <div key={p.serponto_id ?? j} className="flex items-center gap-2 text-xs">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          String(p.status || '').toLowerCase().includes('conect') &&
                          !String(p.status || '').toLowerCase().includes('desconect')
                            ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                      <span className="text-gray-700">{p.plano || DASH}</span>
                      {p.velocidade && <span className="text-gray-400">· {p.velocidade}</span>}
                    </div>
                  ))}
                </div>
              )}

              {c.permiteLiberacao === false && (
                <p className="text-[11px] text-gray-400 mt-1.5">Não permite liberação temporária</p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

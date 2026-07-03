'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supportApi, ApiError } from '@/lib/client'
import { extractCodcliente } from '@/lib/format'
import ClientHeader from './ClientHeader'
import ContractSelector from './ContractSelector'
import StatusPanel from './StatusPanel'
import InvoicesPanel from './InvoicesPanel'
import ActionsPanel from './ActionsPanel'
import NotificationsPanel from './NotificationsPanel'

const TABS = [
  { key: 'status', label: 'Status' },
  { key: 'invoices', label: 'Faturas' },
  { key: 'notifications', label: 'Notificações' },
  { key: 'actions', label: 'Ações' },
]

export default function SupportDashboard({ initialCredential = '' }) {
  const router = useRouter()

  const [input, setInput] = useState(initialCredential)
  const [credential, setCredential] = useState(initialCredential)
  const [inputError, setInputError] = useState('')

  const [overview, setOverview] = useState(null)
  const [overviewLoading, setOverviewLoading] = useState(false)

  const [contratos, setContratos] = useState([])
  const [contractsLoading, setContractsLoading] = useState(false)
  const [selected, setSelected] = useState('')

  const [status, setStatus] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [invoices, setInvoices] = useState(null)
  const [invoicesLoading, setInvoicesLoading] = useState(false)

  const [tab, setTab] = useState('status')
  const [error, setError] = useState('')
  const searched = credential !== ''
  const didInit = useRef(false)

  const handleAuthError = useCallback((err) => {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      // 403 aqui pode ser gate de admin — manda pro login.
      if (err.status === 401) { router.push('/login'); return true }
    }
    return false
  }, [router])

  const loadContract = useCallback(async (cod) => {
    if (!cod) return
    setStatusLoading(true)
    setInvoicesLoading(true)
    setStatus(null)
    setInvoices(null)
    // As duas partes falham isoladamente — uma não derruba a outra.
    supportApi.status(cod)
      .then(setStatus)
      .catch((err) => { if (!handleAuthError(err)) setStatus(null) })
      .finally(() => setStatusLoading(false))
    supportApi.invoices(cod)
      .then(setInvoices)
      .catch((err) => { if (!handleAuthError(err)) setInvoices(null) })
      .finally(() => setInvoicesLoading(false))
  }, [handleAuthError])

  const runSearch = useCallback(async (cred) => {
    setError('')
    setOverviewLoading(true)
    setContractsLoading(true)
    setOverview(null)
    setContratos([])
    setSelected('')
    setStatus(null)
    setInvoices(null)

    const ov = supportApi.overview(cred)
      .then((data) => setOverview({ ...data, credential: cred }))
      .catch((err) => {
        if (!handleAuthError(err)) setError(err.message || 'Erro ao carregar o cliente.')
      })
      .finally(() => setOverviewLoading(false))

    const ct = supportApi.contracts(cred)
      .then((data) => {
        const list = data?.contratos || []
        setContratos(list)
        const first = list.find((c) => extractCodcliente(c))
        const cod = first ? extractCodcliente(first) : ''
        setSelected(cod)
        if (cod) loadContract(cod)
      })
      .catch((err) => { if (!handleAuthError(err)) setContratos([]) })
      .finally(() => setContractsLoading(false))

    await Promise.allSettled([ov, ct])
  }, [handleAuthError, loadContract])

  // Recarrega só o overview (ex.: após criar/excluir conta do app), preservando
  // o contrato selecionado e as abas de status/faturas.
  const reloadOverview = useCallback(() => {
    if (!credential) return
    supportApi.overview(credential)
      .then((data) => setOverview({ ...data, credential }))
      .catch((err) => { handleAuthError(err) })
  }, [credential, handleAuthError])

  // Busca automática se veio ?credential= na URL.
  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    if (initialCredential) runSearch(initialCredential)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function commitSearch() {
    const cred = input.trim()
    if (!cred) {
      setInputError('Informe um CPF ou código de cliente.')
      return
    }
    setInputError('')
    setCredential(cred)
    router.replace(`/suporte?credential=${encodeURIComponent(cred)}`, { scroll: false })
    runSearch(cred)
  }

  function selectContract(cod) {
    setSelected(cod)
    loadContract(cod)
  }

  function refresh() {
    if (searched) runSearch(credential)
  }

  const cpf = overview?.isClient?.cpf || overview?.appAccount?.cpf || ''
  const appExists = overview?.appAccount?.exists === true
  const selectedContrato = contratos.find((c) => extractCodcliente(c) === selected)
  const permiteLiberacao = selectedContrato?.permiteLiberacao !== false

  return (
    <div className="flex flex-col gap-5">
      {/* Busca */}
      <div className="bg-white border border-gray-200 p-4">
        <label htmlFor="credential" className="block text-sm font-medium text-gray-700 mb-1.5">
          Buscar cliente por CPF ou código de cliente
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="credential"
            value={input}
            onChange={(e) => { setInput(e.target.value); setInputError('') }}
            onKeyDown={(e) => { if (e.key === 'Enter') commitSearch() }}
            placeholder="CPF (11 dígitos) ou codcliente"
            className="flex-1 max-w-xs bg-white border border-gray-300 px-3.5 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9c0004] focus:border-transparent transition"
          />
          <button
            onClick={commitSearch}
            className="bg-[#9c0004] hover:bg-[#7a0003] text-white font-semibold px-6 py-2.5 transition cursor-pointer"
          >
            Buscar
          </button>
          {searched && (
            <button
              onClick={refresh}
              title="Atualizar"
              className="flex items-center justify-center px-3 py-2.5 border border-gray-300 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
        {inputError && <p className="text-sm text-red-700 mt-2">{inputError}</p>}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-red-700">{error}</span>
          <button onClick={refresh} className="text-sm font-medium text-[#9c0004] hover:underline cursor-pointer">
            Tentar novamente
          </button>
        </div>
      )}

      {!searched ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <p className="text-sm">Busque por CPF ou código de cliente para atender o cliente.</p>
        </div>
      ) : (
        <>
          <ClientHeader overview={overview} loading={overviewLoading} />

          <ContractSelector
            contratos={contratos}
            selected={selected}
            onSelect={selectContract}
            loading={contractsLoading}
          />

          {/* Abas por contrato */}
          <div>
            <div className="flex items-center gap-1 border-b border-gray-200">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition cursor-pointer ${
                    tab === t.key
                      ? 'border-[#9c0004] text-[#9c0004]'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="pt-4">
              {tab === 'status' && (
                selected
                  ? <StatusPanel status={status} loading={statusLoading} />
                  : <EmptyContract />
              )}
              {tab === 'invoices' && (
                selected
                  ? <InvoicesPanel invoices={invoices} loading={invoicesLoading} />
                  : <EmptyContract />
              )}
              {tab === 'notifications' && (
                <NotificationsPanel cpf={cpf} />
              )}
              {tab === 'actions' && (
                <ActionsPanel
                  cpf={cpf}
                  codcliente={selected}
                  credential={credential}
                  appExists={appExists}
                  permiteLiberacao={permiteLiberacao}
                  onLibtempChange={() => selected && loadContract(selected)}
                  onAccountChange={reloadOverview}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function EmptyContract() {
  return (
    <div className="bg-white border border-gray-200 px-4 py-10 text-center text-sm text-gray-400">
      Selecione um contrato para ver estas informações.
    </div>
  )
}

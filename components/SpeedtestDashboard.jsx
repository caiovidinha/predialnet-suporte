'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { speedtestApi, ApiError } from '@/lib/client'
import { sanitizeCpf, maskCpf, isValidCpf } from '@/lib/format'
import SummaryCards from './SummaryCards'
import TestsTable from './TestsTable'
import DownloadChart from './DownloadChart'
import TestDetailModal from './TestDetailModal'

const PAGE_LIMIT = 20

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'completed', label: 'Concluído' },
  { value: 'aborted', label: 'Abortado' },
  { value: 'error', label: 'Erro' },
]

export default function SpeedtestDashboard({ initialCpf = '' }) {
  const router = useRouter()

  const [cpfInput, setCpfInput] = useState(maskCpf(initialCpf))
  const [cpf, setCpf] = useState(isValidCpf(initialCpf) ? sanitizeCpf(initialCpf) : '')
  const [inputError, setInputError] = useState('')

  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [listLoading, setListLoading] = useState(false)

  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const searched = cpf !== ''

  // Evita repetir a busca automática inicial.
  const didInit = useRef(false)

  const handleAuthError = useCallback((err) => {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      router.push('/login')
      return true
    }
    return false
  }, [router])

  const toIso = (dateStr, endOfDay) => {
    if (!dateStr) return ''
    const d = new Date(`${dateStr}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`)
    return Number.isNaN(d.getTime()) ? '' : d.toISOString()
  }

  const loadSummary = useCallback(async (targetCpf) => {
    setSummaryLoading(true)
    try {
      const data = await speedtestApi.summary(targetCpf)
      setSummary(data)
    } catch (err) {
      if (!handleAuthError(err)) setError(err.message || 'Erro ao carregar o resumo.')
    } finally {
      setSummaryLoading(false)
    }
  }, [handleAuthError])

  const loadList = useCallback(async (targetCpf, targetPage, filters) => {
    setListLoading(true)
    setError('')
    try {
      const data = await speedtestApi.results({
        cpf: targetCpf,
        status: filters.status,
        from: toIso(filters.from, false),
        to: toIso(filters.to, true),
        page: targetPage,
        limit: PAGE_LIMIT,
      })
      setItems(data.items || [])
      setTotal(data.total || 0)
      setPage(data.page || targetPage)
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(err.message || 'Erro ao carregar os testes.')
        setItems([])
        setTotal(0)
      }
    } finally {
      setListLoading(false)
    }
  }, [handleAuthError])

  const runSearch = useCallback((targetCpf) => {
    setError('')
    loadSummary(targetCpf)
    loadList(targetCpf, 1, { status, from, to })
  }, [loadSummary, loadList, status, from, to])

  // Busca automática se veio ?cpf= válido na URL.
  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    if (isValidCpf(cpf)) runSearch(cpf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function commitCpf() {
    const digits = sanitizeCpf(cpfInput)
    if (!isValidCpf(digits)) {
      setInputError('Informe um CPF válido (11 dígitos).')
      return
    }
    setInputError('')
    setCpf(digits)
    setPage(1)
    router.replace(`/speedtest?cpf=${digits}`, { scroll: false })
    runSearch(digits)
  }

  function applyFilters() {
    if (!searched) return
    loadList(cpf, 1, { status, from, to })
  }

  function clearFilters() {
    setStatus('')
    setFrom('')
    setTo('')
    if (searched) loadList(cpf, 1, { status: '', from: '', to: '' })
  }

  function goToPage(p) {
    loadList(cpf, p, { status, from, to })
  }

  function refresh() {
    if (searched) runSearch(cpf)
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT))
  const anyLoading = summaryLoading || listLoading

  return (
    <div className="flex flex-col gap-5">
      {/* Busca por CPF */}
      <div className="bg-white border border-gray-200 p-4">
        <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-1.5">
          Buscar testes por CPF
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="cpf"
            inputMode="numeric"
            value={cpfInput}
            onChange={(e) => { setCpfInput(maskCpf(e.target.value)); setInputError('') }}
            onKeyDown={(e) => { if (e.key === 'Enter') commitCpf() }}
            placeholder="000.000.000-00"
            className="flex-1 max-w-xs bg-white border border-gray-300 px-3.5 py-2.5 text-gray-900 placeholder-gray-400 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#9c0004] focus:border-transparent transition"
          />
          <button
            onClick={commitCpf}
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

      {/* Erro de rede */}
      {error && (
        <div className="bg-red-50 border border-red-200 px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-red-700">{error}</span>
          <button
            onClick={refresh}
            className="text-sm font-medium text-[#9c0004] hover:underline cursor-pointer"
          >
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
          <p className="text-sm">Informe um CPF para ver os testes de velocidade do cliente.</p>
        </div>
      ) : (
        <>
          <SummaryCards summary={summary} loading={summaryLoading} />

          {items.length >= 2 && <DownloadChart items={items} />}

          {/* Filtros */}
          <div className="bg-white border border-gray-200 p-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#9c0004] cursor-pointer"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">De</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#9c0004]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Até</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#9c0004]"
              />
            </div>
            <button
              onClick={applyFilters}
              className="bg-[#9c0004] hover:bg-[#7a0003] text-white text-sm font-medium px-4 py-2 transition cursor-pointer"
            >
              Aplicar
            </button>
            {(status || from || to) && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-900 px-3 py-2 transition cursor-pointer"
              >
                Limpar
              </button>
            )}
            <span className="ml-auto text-sm text-gray-500 self-center">
              {listLoading ? 'Carregando...' : `${total} teste${total === 1 ? '' : 's'}`}
            </span>
          </div>

          <TestsTable items={items} loading={listLoading} onSelect={setSelected} />

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1 || anyLoading}
                className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
              >
                ‹ Anterior
              </button>
              <span className="text-sm text-gray-500">Página {page} de {totalPages}</span>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages || anyLoading}
                className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
              >
                Próxima ›
              </button>
            </div>
          )}
        </>
      )}

      {selected && (
        <TestDetailModal
          testId={selected.id}
          fallback={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

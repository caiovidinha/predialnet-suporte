'use client'

import { useEffect, useState } from 'react'
import { speedtestApi } from '@/lib/client'
import StatusBadge from './StatusBadge'
import PingSparkline from './PingSparkline'
import JsonViewer from './JsonViewer'
import {
  formatMbps, formatMs, formatBytes, formatNumber, formatPercent,
  formatDurationMs, formatDateTimeFullBR, formatSpan, sampleStats,
  connectionLabel, platformLabel, maskCpf, DASH,
} from '@/lib/format'

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{title}</h3>
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">{children}</dl>
    </div>
  )
}

function Field({ label, value, wide }) {
  return (
    <div className={wide ? 'col-span-2 sm:col-span-3' : ''}>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 tabular-nums break-words">{value ?? DASH}</dd>
    </div>
  )
}

export default function TestDetailModal({ testId, fallback, onClose }) {
  const [test, setTest] = useState(fallback || null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    speedtestApi.result(testId)
      .then((data) => { if (!cancelled) setTest(data) })
      .catch((err) => { if (!cancelled) setError(err.message || 'Erro ao carregar o teste.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [testId])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const t = test
  const ping = sampleStats(t?.pingSamples)

  return (
    <div
      className="fixed inset-0 z-30 bg-black/40 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200 shadow-xl w-full max-w-3xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-sm font-semibold text-gray-900">Detalhe do teste</h2>
            {t?.status && <StatusBadge status={t.status} />}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 text-xl leading-none px-2 cursor-pointer"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          {loading && !t ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <div className="w-7 h-7 border-2 border-[#9c0004] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Carregando teste...</p>
            </div>
          ) : error && !t ? (
            <div className="py-12 text-center text-red-700">{error}</div>
          ) : t ? (
            <div className="flex flex-col gap-6">
              <div className="text-xs text-gray-400 -mt-1 font-mono break-all">
                {t.id} · CPF {t.cpf ? maskCpf(t.cpf) : DASH}
              </div>

              <Section title="Resultados">
                <Field label="Download" value={formatMbps(t.downloadMbps)} />
                <Field label="Upload" value={formatMbps(t.uploadMbps)} />
                <Field label="Ping" value={formatMs(t.pingMs)} />
                <Field label="Jitter" value={formatMs(t.jitterMs)} />
                <Field label="Perda de pacotes" value={formatPercent(t.packetLoss)} />
              </Section>

              <Section title="Download">
                <Field label="Transferido" value={formatBytes(t.downloadBytes)} />
                <Field label="Duração" value={formatDurationMs(t.downloadDurationMs)} />
                <Field label="Conexões" value={formatNumber(t.downloadConnections)} />
              </Section>

              <Section title="Upload">
                <Field label="Transferido" value={formatBytes(t.uploadBytes)} />
                <Field label="Duração" value={formatDurationMs(t.uploadDurationMs)} />
                <Field label="Conexões" value={formatNumber(t.uploadConnections)} />
              </Section>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Ping</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 mb-3">
                  <Field label="Amostras" value={formatNumber(ping.count)} />
                  <Field label="Mín." value={formatMs(ping.min)} />
                  <Field label="Média" value={formatMs(ping.avg)} />
                  <Field label="Máx." value={formatMs(ping.max)} />
                </div>
                <PingSparkline samples={t.pingSamples} />
              </div>

              <Section title="Dispositivo / rede">
                <Field label="Versão do app" value={t.appVersion} />
                <Field label="Plataforma" value={platformLabel(t.platform)} />
                <Field label="Versão do SO" value={t.osVersion} />
                <Field label="Modelo" value={t.deviceModel} />
                <Field label="Conexão" value={connectionLabel(t.connectionType)} />
                <Field label="Operadora" value={t.carrier} />
              </Section>

              <Section title="Servidor">
                <Field label="IP do cliente" value={t.clientIp} />
                <Field label="Host do servidor" value={t.serverHost} />
                <Field label="User agent" value={t.userAgent} wide />
              </Section>

              <Section title="Execução">
                <Field label="Início" value={formatDateTimeFullBR(t.startedAt)} />
                <Field label="Fim" value={formatDateTimeFullBR(t.finishedAt)} />
                <Field label="Duração total" value={formatSpan(t.startedAt, t.finishedAt)} />
                <Field label="Registrado em" value={formatDateTimeFullBR(t.createdAt)} />
                {t.errorMessage && <Field label="Erro" value={t.errorMessage} wide />}
              </Section>

              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Avançado</h3>
                <JsonViewer label="config" value={t.config} />
                <JsonViewer label="raw" value={t.raw} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

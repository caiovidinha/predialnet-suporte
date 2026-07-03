// ---------------------------------------------------------------------------
// Formatação pt-BR e helpers de dados do speedtest.
// Toda métrica ausente (null / undefined / NaN) vira o traço "—", nunca "NaN".
// ---------------------------------------------------------------------------

export const DASH = '—'

function isNil(v) {
  return v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v))
}

/** 271.34 -> "271.3 Mbps"  |  null -> "—" */
export function formatMbps(n, { suffix = true } = {}) {
  if (isNil(n)) return DASH
  const value = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(n)
  return suffix ? `${value} Mbps` : value
}

/** 9.4 -> "9.4 ms"  |  22 -> "22 ms"  |  null -> "—"  (1 casa, sem zero à toa) */
export function formatMs(n, { suffix = true } = {}) {
  if (isNil(n)) return DASH
  const value = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(n)
  return suffix ? `${value} ms` : value
}

/** Número genérico pt-BR com casas configuráveis. */
export function formatNumber(n, digits = 0) {
  if (isNil(n)) return DASH
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n)
}

/** Percentual: 0.021 (fração) ou 2.1 (já em %). Heurística: <=1 é fração. */
export function formatPercent(n) {
  if (isNil(n)) return DASH
  const pct = n <= 1 ? n * 100 : n
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(pct)}%`
}

/** 149000000 -> "142.1 MB"  |  null -> "—" */
export function formatBytes(n) {
  if (isNil(n)) return DASH
  if (n === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.min(Math.floor(Math.log(Math.abs(n)) / Math.log(k)), units.length - 1)
  const value = n / Math.pow(k, i)
  const digits = i === 0 ? 0 : 1
  return `${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)} ${units[i]}`
}

/** Milissegundos -> "3.2 s"  |  null -> "—" */
export function formatDurationMs(ms) {
  if (isNil(ms)) return DASH
  return `${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(ms / 1000)} s`
}

/** Duração entre dois ISOs -> "3.2 s" | "1 min 05 s" | "—" */
export function formatSpan(startIso, endIso) {
  if (!startIso || !endIso) return DASH
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime()
  if (Number.isNaN(ms) || ms < 0) return DASH
  if (ms < 60000) return formatDurationMs(ms)
  const min = Math.floor(ms / 60000)
  const sec = Math.round((ms % 60000) / 1000)
  return `${min} min ${String(sec).padStart(2, '0')} s`
}

/** ISO -> "03/07/2026 14:35"  |  null -> "—" */
export function formatDateTimeBR(iso) {
  if (!iso) return DASH
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return String(iso)
  }
}

/** ISO -> "03/07/2026 14:35:07" (com segundos, para detalhe). */
export function formatDateTimeFullBR(iso) {
  if (!iso) return DASH
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).format(new Date(iso))
  } catch {
    return String(iso)
  }
}

// --------------------------------- CPF -------------------------------------

/** Deixa só os 11 dígitos. "123.456.789-01" -> "12345678901" */
export function sanitizeCpf(v) {
  return String(v ?? '').replace(/\D/g, '').slice(0, 11)
}

/** Aplica máscara progressiva: "12345678901" -> "123.456.789-01" */
export function maskCpf(v) {
  const d = sanitizeCpf(v)
  const parts = []
  if (d.length > 0) parts.push(d.slice(0, 3))
  if (d.length > 3) parts.push(d.slice(3, 6))
  if (d.length > 6) parts.push(d.slice(6, 9))
  let out = parts.join('.')
  if (d.length > 9) out += `-${d.slice(9, 11)}`
  return out
}

/** Valida quantidade de dígitos (11). Não valida dígito verificador. */
export function isValidCpf(v) {
  return sanitizeCpf(v).length === 11
}

// --------------------------- estatísticas ----------------------------------

/** min / avg / max de um array de amostras (ex.: pingSamples). */
export function sampleStats(samples) {
  if (!Array.isArray(samples) || samples.length === 0) {
    return { min: null, avg: null, max: null, count: 0 }
  }
  const nums = samples.filter((n) => typeof n === 'number' && !Number.isNaN(n))
  if (nums.length === 0) return { min: null, avg: null, max: null, count: 0 }
  const sum = nums.reduce((a, b) => a + b, 0)
  return {
    min: Math.min(...nums),
    avg: sum / nums.length,
    max: Math.max(...nums),
    count: nums.length,
  }
}

/** Rótulo pt-BR para o tipo de conexão. */
export function connectionLabel(type) {
  if (!type) return DASH
  const map = { wifi: 'Wi-Fi', cellular: 'Celular', ethernet: 'Cabo', wired: 'Cabo' }
  return map[String(type).toLowerCase()] ?? type
}

/** Rótulo pt-BR para a plataforma. */
export function platformLabel(p) {
  if (!p) return DASH
  const map = { ios: 'iOS', android: 'Android', web: 'Web' }
  return map[String(p).toLowerCase()] ?? p
}

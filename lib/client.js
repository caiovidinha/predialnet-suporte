// ---------------------------------------------------------------------------
// Client central usado pelos componentes de browser.
//
// Chama as rotas internas /api/* (que injetam o x-access-token server-side),
// monta query strings e normaliza os erros em mensagens pt-BR.
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function messageForStatus(status, fallback) {
  if (status === 401 || status === 403) return 'Sessão ou permissão inválida.'
  if (status === 404) return 'Registro não encontrado.'
  if (status >= 500) return 'Erro no servidor. Tente novamente.'
  return fallback || 'Não foi possível completar a requisição.'
}

async function request(path, { signal } = {}) {
  let res
  try {
    res = await fetch(path, { signal })
  } catch (err) {
    if (err?.name === 'AbortError') throw err
    throw new ApiError('Falha de conexão. Verifique sua internet.', 0)
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    throw new ApiError(messageForStatus(res.status, data?.error), res.status)
  }
  return data
}

function qs(params) {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      sp.set(key, String(value))
    }
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export const speedtestApi = {
  /** Resumo do cliente pelo CPF (só dígitos). */
  summary(cpf, opts) {
    return request(`/api/speedtest/summary${qs({ cpf })}`, opts)
  },

  /** Listagem de testes com filtros + paginação. */
  results({ cpf, status, from, to, page, limit }, opts) {
    return request(`/api/speedtest/results${qs({ cpf, status, from, to, page, limit })}`, opts)
  },

  /** Detalhe de um teste pelo id. 404 -> "Teste não encontrado". */
  async result(id, opts) {
    try {
      return await request(`/api/speedtest/results/${encodeURIComponent(id)}`, opts)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        throw new ApiError('Teste não encontrado.', 404)
      }
      throw err
    }
  },
}

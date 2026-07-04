// ---------------------------------------------------------------------------
// Client central usado pelos componentes de browser.
//
// Chama as rotas internas /api/* (que injetam o x-access-token server-side),
// monta query strings e normaliza os erros em mensagens pt-BR.
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    // Corpo da resposta de erro (ex.: availableEmails no 409). Pode ser null.
    this.data = data
  }
}

function messageForStatus(status, fallback) {
  if (status === 401 || status === 403) return 'Sessão ou permissão inválida.'
  if (status === 404) return 'Registro não encontrado.'
  if (status >= 500) return 'Erro no servidor. Tente novamente.'
  return fallback || 'Não foi possível completar a requisição.'
}

async function request(path, { signal, method = 'GET', body } = {}) {
  const init = { method, signal }
  if (body !== undefined) {
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      // multipart: o browser define o Content-Type com boundary.
      init.body = body
    } else {
      init.headers = { 'Content-Type': 'application/json' }
      init.body = JSON.stringify(body)
    }
  }

  let res
  try {
    res = await fetch(path, init)
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
    throw new ApiError(messageForStatus(res.status, data?.error), res.status, data)
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

export const supportApi = {
  /** Visão agregada (isClient, appAccount, account) por CPF ou codcliente. */
  overview(credential, opts) {
    return request(`/api/support/overview${qs({ credential })}`, opts)
  },

  /** Contratos (codcliente) de um CPF para o operador selecionar. */
  contracts(credential, opts) {
    return request(`/api/support/contracts${qs({ credential })}`, opts)
  },

  /** Status de conexão + pagamento + libtemp por contrato. */
  status(codcliente, opts) {
    return request(`/api/support/status${qs({ codcliente })}`, opts)
  },

  /** Faturas do contrato (history / current / pastStatus). */
  invoices(codcliente, opts) {
    return request(`/api/support/invoices${qs({ codcliente })}`, opts)
  },

  /** Consulta a liberação temporária do contrato. */
  libtemp(codcliente, opts) {
    return request(`/api/support/libtemp${qs({ codcliente })}`, opts)
  },

  /** Cria liberação temporária (prazo em dias). */
  createLibtemp(codcliente, prazo, opts) {
    return request('/api/support/libtemp', { ...opts, method: 'POST', body: { codcliente, prazo } })
  },

  /** Remove liberação temporária pelo id. */
  removeLibtemp(id, opts) {
    return request(`/api/support/libtemp/${encodeURIComponent(id)}`, { ...opts, method: 'DELETE' })
  },

  /** Redefinir senha: sendEmail=false devolve o link; true envia por e-mail. */
  passwordReset(cpf, sendEmail = false, opts) {
    return request('/api/support/password-reset', { ...opts, method: 'POST', body: { cpf, sendEmail } })
  },

  /** E-mails censurados disponíveis para criar a conta do app. */
  availableEmails(credential, opts) {
    return request(`/api/support/available-emails${qs({ credential })}`, opts)
  },

  /** Cria a conta do app (envia senha por e-mail ao cliente). */
  createAccount(cpf, email, opts) {
    return request('/api/support/create-account', { ...opts, method: 'POST', body: { cpf, email } })
  },

  /** Exclui a conta do app do cliente (destrutivo — não afeta o cadastro UAIPI). */
  deleteAppAccount(cpf, opts) {
    return request(`/api/support/app-account${qs({ cpf })}`, { ...opts, method: 'DELETE' })
  },

  /** E-mail atual da conta do app (User.email). */
  getEmail(cpf, opts) {
    return request(`/api/support/email${qs({ cpf })}`, opts)
  },

  /** Altera o e-mail da conta do app + do contrato (codcliente) na Predialnet. */
  updateEmail(cpf, email, codcliente, opts) {
    return request('/api/support/email', { ...opts, method: 'PUT', body: { cpf, email, codcliente } })
  },

  /** Notificações push que o cliente recebeu no app (mais recentes primeiro). */
  notifications(cpf, opts) {
    return request(`/api/support/notifications${qs({ cpf })}`, opts)
  },
}

export const ticketsApi = {
  /** Board kanban com as 5 colunas. */
  board(opts) {
    return request('/api/tickets/board', opts)
  },

  /** Lista com filtros + paginação. */
  list({ status, priority, assignee, cpf, q, page, limit } = {}, opts) {
    return request(`/api/tickets${qs({ status, priority, assignee, cpf, q, page, limit })}`, opts)
  },

  /** Abre chamado (operador autenticado). */
  create(payload, opts) {
    return request('/api/tickets', { ...opts, method: 'POST', body: payload })
  },

  /** Detalhe com comentários e anexos. */
  get(id, opts) {
    return request(`/api/tickets/${encodeURIComponent(id)}`, opts)
  },

  /** Atualiza/move no kanban (status, position, priority, assignee, ...). */
  update(id, patch, opts) {
    return request(`/api/tickets/${encodeURIComponent(id)}`, { ...opts, method: 'PATCH', body: patch })
  },

  /** Remove chamado (soft delete). */
  remove(id, opts) {
    return request(`/api/tickets/${encodeURIComponent(id)}`, { ...opts, method: 'DELETE' })
  },

  /** Adiciona comentário/andamento. */
  addComment(id, { body, author, internal }, opts) {
    return request(`/api/tickets/${encodeURIComponent(id)}/comments`, {
      ...opts, method: 'POST', body: { body, author, internal },
    })
  },

  /** Envia anexo (File). */
  uploadAttachment(id, file, uploadedBy, opts) {
    const fd = new FormData()
    fd.append('file', file)
    if (uploadedBy) fd.append('uploadedBy', uploadedBy)
    return request(`/api/tickets/${encodeURIComponent(id)}/attachments`, { ...opts, method: 'POST', body: fd })
  },

  /** URL temporária assinada para baixar um anexo (gerar na hora do clique). */
  attachmentUrl(id, attId, opts) {
    return request(`/api/tickets/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attId)}/url`, opts)
  },

  /** Remove um anexo. */
  removeAttachment(id, attId, opts) {
    return request(`/api/tickets/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attId)}`, { ...opts, method: 'DELETE' })
  },
}

/** Abertura pública (form standalone, sem login). */
export function createPublicTicket(payload, opts) {
  return request('/api/public/tickets', { ...opts, method: 'POST', body: payload })
}

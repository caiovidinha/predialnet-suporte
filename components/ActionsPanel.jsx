'use client'

import { useState, useEffect } from 'react'
import { supportApi, ApiError } from '@/lib/client'

function Section({ title, description, children }) {
  return (
    <div className="bg-white border border-gray-200 p-4 flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function Feedback({ state }) {
  if (!state) return null
  const tones = {
    success: 'bg-green-50 border-green-200 text-green-700',
    error: 'bg-red-50 border-red-200 text-red-700',
    info: 'bg-gray-50 border-gray-200 text-gray-600',
  }
  return (
    <div className={`border px-3 py-2 text-sm ${tones[state.tone] || tones.info}`}>
      {state.message}
    </div>
  )
}

function CopyField({ value }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-stretch gap-2">
      <input
        readOnly
        value={value}
        onFocus={(e) => e.target.select()}
        className="flex-1 min-w-0 border border-gray-300 px-3 py-2 text-xs text-gray-700 bg-gray-50"
      />
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          } catch { /* clipboard indisponível */ }
        }}
        className="px-3 py-2 text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-100 transition cursor-pointer whitespace-nowrap"
      >
        {copied ? 'Copiado!' : 'Copiar'}
      </button>
    </div>
  )
}

export default function ActionsPanel({ cpf, codcliente, credential, appExists, permiteLiberacao = true, onLibtempChange, onAccountChange }) {
  const cpfOk = String(cpf || '').length === 11
  const [deleted, setDeleted] = useState(false)
  const effectiveAppExists = appExists && !deleted

  // ---- Redefinir senha ----
  const [resetLoading, setResetLoading] = useState(false)
  const [resetLink, setResetLink] = useState('')
  const [resetFeedback, setResetFeedback] = useState(null)

  async function resetPassword(sendEmail) {
    setResetLoading(true)
    setResetLink('')
    setResetFeedback(null)
    try {
      const data = await supportApi.passwordReset(cpf, sendEmail)
      if (sendEmail) {
        setResetFeedback({ tone: 'success', message: data?.message || 'E-mail de redefinição enviado ao cliente.' })
      } else {
        setResetLink(data?.url || '')
        setResetFeedback({ tone: 'success', message: data?.message || 'Link gerado. Repasse ao cliente.' })
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const emails = err.data?.availableEmails || []
        setResetFeedback({
          tone: 'error',
          message: `${err.data?.error || 'E-mail do app diverge do cadastro.'}${emails.length ? ` Disponíveis: ${emails.join(', ')}` : ''}`,
        })
      } else if (err instanceof ApiError && err.status === 403) {
        setResetFeedback({ tone: 'error', message: 'Cliente ainda não criou a conta do app.' })
      } else {
        setResetFeedback({ tone: 'error', message: err.message || 'Não foi possível redefinir a senha.' })
      }
    } finally {
      setResetLoading(false)
    }
  }

  // ---- E-mail da conta do app ----
  const [emailInput, setEmailInput] = useState('')
  const [emailCensored, setEmailCensored] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailFeedback, setEmailFeedback] = useState(null)

  useEffect(() => {
    if (!effectiveAppExists || !cpfOk) return
    let active = true
    setEmailLoading(true)
    setEmailFeedback(null)
    supportApi.getEmail(cpf)
      .then((data) => {
        if (!active) return
        setEmailInput(data?.email || '')
        setEmailCensored(data?.censoredEmail || '')
      })
      .catch((err) => {
        if (!active) return
        setEmailFeedback({ tone: 'error', message: err.message || 'Não foi possível carregar o e-mail.' })
      })
      .finally(() => active && setEmailLoading(false))
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cpf, effectiveAppExists])

  async function saveEmail() {
    const email = emailInput.trim()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setEmailFeedback({ tone: 'error', message: 'Informe um e-mail válido.' })
      return
    }
    if (!codcliente) {
      setEmailFeedback({ tone: 'error', message: 'Selecione um contrato antes de alterar o e-mail.' })
      return
    }
    setEmailSaving(true)
    setEmailFeedback(null)
    try {
      const data = await supportApi.updateEmail(cpf, email, codcliente)
      setEmailInput(data?.email || email)
      setEmailCensored(data?.censoredEmail || '')
      setEmailFeedback({ tone: 'success', message: data?.message || 'E-mail atualizado com sucesso.' })
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setEmailFeedback({ tone: 'error', message: 'Conta do app não encontrada para este CPF.' })
      } else if (err instanceof ApiError && err.status === 502) {
        setEmailFeedback({ tone: 'error', message: 'Falha ao atualizar na Predialnet. Tente novamente.' })
      } else {
        setEmailFeedback({ tone: 'error', message: err.message || 'Não foi possível atualizar o e-mail.' })
      }
    } finally {
      setEmailSaving(false)
    }
  }

  // ---- Liberação temporária ----
  const [prazo, setPrazo] = useState(2)
  const [libLoading, setLibLoading] = useState(false)
  const [libFeedback, setLibFeedback] = useState(null)

  async function createLibtemp() {
    if (!codcliente) return
    setLibLoading(true)
    setLibFeedback(null)
    try {
      await supportApi.createLibtemp(codcliente, Number(prazo))
      setLibFeedback({ tone: 'success', message: `Liberação de ${prazo} dia(s) criada.` })
      onLibtempChange?.()
    } catch (err) {
      setLibFeedback({ tone: 'error', message: err.message || 'Não foi possível criar a liberação.' })
    } finally {
      setLibLoading(false)
    }
  }

  // ---- Criar conta do app ----
  const [accStep, setAccStep] = useState('idle') // idle | picking | done
  const [accEmails, setAccEmails] = useState([])
  const [accLoading, setAccLoading] = useState(false)
  const [accFeedback, setAccFeedback] = useState(null)

  async function loadEmails() {
    setAccLoading(true)
    setAccFeedback(null)
    try {
      const data = await supportApi.availableEmails(credential)
      const emails = data?.emails || []
      setAccEmails(emails)
      setAccStep('picking')
      if (!emails.length) {
        setAccFeedback({ tone: 'info', message: 'Nenhum e-mail disponível para criar a conta.' })
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setAccFeedback({ tone: 'error', message: 'Não é cliente ou a conta do app já existe.' })
      } else {
        setAccFeedback({ tone: 'error', message: err.message || 'Não foi possível carregar os e-mails.' })
      }
    } finally {
      setAccLoading(false)
    }
  }

  async function createAccount(email) {
    setAccLoading(true)
    setAccFeedback(null)
    try {
      const data = await supportApi.createAccount(cpf, email)
      setAccStep('done')
      setAccFeedback({ tone: 'success', message: data?.message || 'Senha enviada com sucesso.' })
      onAccountChange?.()
    } catch (err) {
      setAccFeedback({ tone: 'error', message: err.message || 'Não foi possível criar a conta.' })
    } finally {
      setAccLoading(false)
    }
  }

  // ---- Excluir conta do app (destrutivo) ----
  const [delConfirming, setDelConfirming] = useState(false)
  const [delLoading, setDelLoading] = useState(false)
  const [delFeedback, setDelFeedback] = useState(null)

  async function deleteAccount() {
    setDelLoading(true)
    setDelFeedback(null)
    try {
      await supportApi.deleteAppAccount(cpf)
      setDeleted(true)
      setDelConfirming(false)
      // Reseta o fluxo de criação para permitir recriar em seguida.
      setAccStep('idle')
      setAccEmails([])
      setAccFeedback({ tone: 'success', message: 'Conta do app excluída. É possível recriá-la abaixo.' })
      onAccountChange?.()
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setDelFeedback({ tone: 'error', message: 'Conta do app não encontrada para este CPF.' })
      } else {
        setDelFeedback({ tone: 'error', message: err.message || 'Não foi possível excluir a conta.' })
      }
    } finally {
      setDelLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Redefinir senha */}
      <Section title="Redefinir senha" description="Gera um link ou envia o e-mail de redefinição ao cliente.">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => resetPassword(false)}
            disabled={!cpfOk || resetLoading}
            className="bg-[#9c0004] hover:bg-[#7a0003] text-white text-sm font-medium px-4 py-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {resetLoading ? 'Gerando...' : 'Gerar link'}
          </button>
          <button
            onClick={() => resetPassword(true)}
            disabled={!cpfOk || resetLoading}
            className="border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm font-medium px-4 py-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Enviar por e-mail
          </button>
        </div>
        {resetLink && <CopyField value={resetLink} />}
        <Feedback state={resetFeedback} />
      </Section>

      {/* E-mail da conta do app */}
      {effectiveAppExists && (
        <Section title="E-mail da conta do app" description="E-mail de login no aplicativo e cadastrado na Predialnet.">
          {emailLoading ? (
            <div className="h-9 w-full bg-gray-100 animate-pulse rounded" />
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => { setEmailInput(e.target.value); setEmailFeedback(null) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveEmail() }}
                  placeholder="novo@dominio.com"
                  className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#9c0004]"
                />
                {emailCensored && (
                  <span className="text-xs text-gray-400">Atual: {emailCensored}</span>
                )}
              </div>
              {codcliente ? (
                <span className="text-xs text-gray-400">Aplica ao contrato #{codcliente}</span>
              ) : (
                <span className="text-xs text-amber-600">Selecione um contrato para alterar o e-mail.</span>
              )}
              <button
                onClick={saveEmail}
                disabled={emailSaving || !codcliente}
                className="bg-[#9c0004] hover:bg-[#7a0003] text-white text-sm font-medium px-4 py-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed self-start"
              >
                {emailSaving ? 'Salvando...' : 'Salvar e-mail'}
              </button>
              <Feedback state={emailFeedback} />
            </>
          )}
        </Section>
      )}

      {/* Liberação temporária */}
      <Section title="Liberação temporária" description="Libera o acesso do contrato por alguns dias.">
        {!codcliente ? (
          <p className="text-sm text-gray-400">Selecione um contrato para liberar.</p>
        ) : !permiteLiberacao ? (
          <p className="text-sm text-gray-400">Este contrato não permite liberação temporária.</p>
        ) : (
          <>
            <div className="flex items-end gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Prazo (dias)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={prazo}
                  onChange={(e) => setPrazo(e.target.value)}
                  className="w-24 border border-gray-300 px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#9c0004]"
                />
              </div>
              <button
                onClick={createLibtemp}
                disabled={libLoading}
                className="bg-[#9c0004] hover:bg-[#7a0003] text-white text-sm font-medium px-4 py-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {libLoading ? 'Criando...' : 'Criar liberação'}
              </button>
            </div>
            <Feedback state={libFeedback} />
          </>
        )}
      </Section>

      {/* Conta do app: excluir (se existe) ou criar (se não existe) */}
      {effectiveAppExists ? (
        <Section title="Conta do app" description="Exclui o acesso ao aplicativo. Não afeta o cadastro na Predialnet.">
          {delConfirming ? (
            <>
              <p className="text-sm text-gray-700">
                Excluir a conta do app deste cliente? O acesso, tokens e notificações
                serão apagados. Esta ação não pode ser desfeita.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={deleteAccount}
                  disabled={delLoading}
                  className="bg-[#9c0004] hover:bg-[#7a0003] text-white text-sm font-medium px-4 py-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {delLoading ? 'Excluindo...' : 'Confirmar exclusão'}
                </button>
                <button
                  onClick={() => setDelConfirming(false)}
                  disabled={delLoading}
                  className="border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm font-medium px-4 py-2 transition cursor-pointer disabled:opacity-40"
                >
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => { setDelConfirming(true); setDelFeedback(null) }}
              disabled={!cpfOk}
              className="border border-red-300 text-red-700 hover:bg-red-50 text-sm font-medium px-4 py-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed self-start"
            >
              Excluir conta do app
            </button>
          )}
          <Feedback state={delFeedback} />
        </Section>
      ) : (
      <Section title="Criar conta do app" description="Envia a senha por e-mail para um dos e-mails do cadastro.">
        {accStep === 'done' ? (
          <Feedback state={accFeedback} />
        ) : accStep === 'picking' ? (
          <>
            <div className="flex flex-col gap-2">
              {accEmails.map((email) => (
                <button
                  key={email}
                  onClick={() => createAccount(email)}
                  disabled={accLoading}
                  className="text-left border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:border-[#9c0004] hover:bg-[#9c0004]/5 transition cursor-pointer disabled:opacity-40"
                >
                  {email}
                </button>
              ))}
            </div>
            <Feedback state={accFeedback} />
          </>
        ) : (
          <>
            <button
              onClick={loadEmails}
              disabled={!cpfOk || accLoading}
              className="bg-[#9c0004] hover:bg-[#7a0003] text-white text-sm font-medium px-4 py-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed self-start"
            >
              {accLoading ? 'Carregando...' : 'Ver e-mails disponíveis'}
            </button>
            <Feedback state={accFeedback} />
          </>
        )}
      </Section>
      )}
    </div>
  )
}

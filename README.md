# Painel de Suporte – Predialnet

Painel administrativo de **suporte** do app Predialnet. Mesma identidade visual e
stack do Painel de Alertas (Next.js App Router + React 19 + Tailwind 4 +
iron-session, JavaScript).

Primeira e única aba por enquanto: **Speedtest** — busca e visualização dos testes
de velocidade de um cliente pelo CPF. A navegação (`components/AppShell.jsx`) já é
preparada para novas abas.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha os valores
npm run dev
```

Acesse http://localhost:3000 → login → `/speedtest`.

## Variáveis de ambiente (`.env.local`)

| Variável | Descrição |
|---|---|
| `API_BASE_URL` | Base da API Predialnet (produção: `https://appgw.predialnet.com.br`) |
| `ADMIN_BYPASS_TOKEN` | Token de operador, injetado server-side no header `x-access-token` |
| `SESSION_SECRET` | Segredo do cookie iron-session (≥ 32 chars) |
| `DASHBOARD_PASSWORD` | Senha de acesso ao painel |

## Arquitetura

- **Auth**: senha do painel → cookie de sessão (iron-session). O `x-access-token`
  **nunca** vai para o browser: os componentes chamam as rotas internas `/api/*`,
  que injetam o token via `lib/api.js` (server-side).
- **Rotas de proxy** (`app/api/speedtest/*`): repassam para
  `GET /speedtest/clients/:cpf/summary`, `GET /speedtest/results` e
  `GET /speedtest/results/:id`, preservando o status HTTP.
- **Client central** (`lib/client.js`): monta query strings e traduz erros
  (401/403 → sessão/permissão inválida; 404 → não encontrado).
- **Helpers de formatação** (`lib/format.js`): `formatBytes`, `formatMbps`,
  `formatMs`, `formatDateTimeBR`, `sanitizeCpf`, `maskCpf`, etc. Toda métrica
  ausente vira `—`.

## Componentes

`AppShell`, `SpeedtestDashboard`, `SummaryCards`, `TestsTable`, `StatusBadge`,
`DownloadChart` (SVG), `PingSparkline` (SVG), `JsonViewer`, `TestDetailModal`.

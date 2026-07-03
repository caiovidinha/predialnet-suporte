'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Navegação do painel de suporte. Novas abas entram aqui
// (ex.: { key: 'chamados', label: 'Chamados', href: '/chamados' }).
const NAV = [
  { key: 'suporte', label: 'Suporte', href: '/suporte' },
  { key: 'speedtest', label: 'Speedtest', href: '/speedtest' },
]

export default function AppShell({ active = 'suporte', children }) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <img src="/img/logo.webp" alt="Predialnet" className="h-7 w-auto" />
          <span className="text-gray-400">|</span>
          <span className="text-gray-500 text-sm font-medium">Painel de Suporte</span>
        </div>

        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-1 bg-gray-100 border border-gray-200 p-1">
            {NAV.map(({ key, label, href }) => (
              <Link
                key={key}
                href={href}
                className={`px-4 py-1.5 text-sm font-medium transition cursor-pointer ${
                  active === key
                    ? 'bg-[#9c0004] text-white'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-900 text-sm px-3 py-2 hover:bg-gray-100 transition cursor-pointer"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 flex flex-col gap-5">
        {children}
      </main>
    </div>
  )
}

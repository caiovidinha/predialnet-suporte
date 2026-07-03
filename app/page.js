import { getIronSessionData } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const session = await getIronSessionData()
  if (!session?.authenticated) {
    redirect('/login')
  }
  // Única aba por enquanto; no futuro haverá um índice de ferramentas de suporte.
  redirect('/speedtest')
}

import { getIronSessionData } from '@/lib/session'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import TicketsBoard from '@/components/TicketsBoard'

export default async function TicketsPage() {
  const session = await getIronSessionData()
  if (!session?.authenticated) {
    redirect('/login')
  }

  return (
    <AppShell active="tickets">
      <TicketsBoard />
    </AppShell>
  )
}

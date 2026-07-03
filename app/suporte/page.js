import { getIronSessionData } from '@/lib/session'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import SupportDashboard from '@/components/SupportDashboard'

export default async function SuportePage({ searchParams }) {
  const session = await getIronSessionData()
  if (!session?.authenticated) {
    redirect('/login')
  }

  const params = await searchParams
  const initialCredential = (params?.credential || '').trim()

  return (
    <AppShell active="suporte">
      <SupportDashboard initialCredential={initialCredential} />
    </AppShell>
  )
}

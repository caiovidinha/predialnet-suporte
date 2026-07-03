import { getIronSessionData } from '@/lib/session'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import SpeedtestDashboard from '@/components/SpeedtestDashboard'

export default async function SpeedtestPage({ searchParams }) {
  const session = await getIronSessionData()
  if (!session?.authenticated) {
    redirect('/login')
  }

  const params = await searchParams
  const initialCpf = (params?.cpf || '').replace(/\D/g, '').slice(0, 11)

  return (
    <AppShell active="speedtest">
      <SpeedtestDashboard initialCpf={initialCpf} />
    </AppShell>
  )
}

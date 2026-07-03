import { getIronSessionData } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const session = await getIronSessionData()
  if (!session?.authenticated) {
    redirect('/login')
  }
  redirect('/suporte')
}

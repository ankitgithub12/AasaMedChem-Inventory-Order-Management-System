import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export default async function IndexPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const role = session.user.role
  if (role === 'ADMIN') {
    redirect('/admin/dashboard')
  } else if (role === 'SELLER') {
    redirect('/seller/products')
  } else if (role === 'BUYER') {
    redirect('/buyer/dashboard')
  }

  redirect('/login')
}

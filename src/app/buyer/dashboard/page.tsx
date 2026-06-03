import React from 'react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { FileText, Hourglass, CheckCircle2, FlaskConical } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 0 // Disable cache for live stats

export default async function BuyerDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const userId = session.user.id
  const userName = session.user.name
  const company = session.user.companyName

  // Fetch counts from DB
  const submittedQuotes = await prisma.quotation.count({
    where: { buyerId: userId },
  })

  const awaitingResponse = await prisma.quotation.count({
    where: {
      buyerId: userId,
      status: { in: ['PENDING', 'REVIEWED'] },
    },
  })

  const confirmedQuotes = await prisma.quotation.count({
    where: { buyerId: userId, status: 'CONFIRMED' },
  })

  const cards = [
    {
      name: 'Total Submitted',
      value: submittedQuotes,
      icon: FileText,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      href: '/buyer/quotations',
    },
    {
      name: 'Awaiting Response',
      value: awaitingResponse,
      icon: Hourglass,
      color: 'text-yellow-450',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      href: '/buyer/quotations',
    },
    {
      name: 'Confirmed Quotes',
      value: confirmedQuotes,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      href: '/buyer/quotations',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/15 p-6 md:p-8 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 translate-x-10 -translate-y-10 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between relative z-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Welcome back, {userName}!
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Authorized Representative for{' '}
              <span className="font-semibold text-emerald-450 uppercase tracking-wider">{company || 'Individual Account'}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/buyer/products"
              className="flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2.5 px-5 text-sm font-semibold text-white transition-colors"
            >
              Browse Catalog
            </Link>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-4">Quotation Summaries</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <Link
                key={card.name}
                href={card.href}
                className={`block rounded-xl border ${card.border} bg-slate-900/40 p-6 shadow-sm hover:scale-[1.02] transition-transform duration-200 backdrop-blur-sm`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-405">{card.name}</span>
                  <div className={`rounded-lg p-2 ${card.bg}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-white">{card.value}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-855 bg-slate-900/20 p-6 backdrop-blur-sm">
        <h3 className="text-base font-semibold text-white mb-2">How Quotations Work</h3>
        <p className="text-sm text-slate-450 leading-relaxed">
          1. Browse our catalog and add chemical or reagent requirements to your <span className="font-semibold text-emerald-450">Quote Request Cart</span>.<br />
          2. Select your required package unit size (GRAM/KILOGRAM, MILLILITER/LITER, or UNIT). Compatible pricing estimates are shown for public items.<br />
          3. Submit the request. Our administrative team will review it, apply custom pricing discounts based on your account status, and publish a quote.<br />
          4. Review the admin response in the <span className="font-semibold text-white">Quotations</span> panel. You can accept the quote to reserve stock and confirm your order, or decline it.
        </p>
      </div>
    </div>
  )
}

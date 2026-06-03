import React from 'react'
import { prisma } from '@/lib/db'
import { Package, AlertTriangle, ShoppingCart, FileText, Users, FlaskConical } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 0 // Disable cache for live stats

export default async function AdminDashboardPage() {
  const totalProducts = await prisma.product.count()
  
  // Low stock warning if stockQuantity < 100 in base units
  const lowStockAlerts = await prisma.product.count({
    where: {
      stockQuantity: {
        lt: 100,
      },
    },
  })

  const pendingOrders = await prisma.order.count({
    where: { status: 'PENDING' },
  })

  const pendingQuotations = await prisma.quotation.count({
    where: { status: 'PENDING' },
  })

  const totalUsers = await prisma.user.count()

  const cards = [
    {
      name: 'Total Products',
      value: totalProducts,
      icon: Package,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      href: '/admin/products',
    },
    {
      name: 'Low Stock Alerts',
      value: lowStockAlerts,
      icon: AlertTriangle,
      color: lowStockAlerts > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      href: '/admin/products?filter=low-stock',
    },
    {
      name: 'Pending Orders',
      value: pendingOrders,
      icon: ShoppingCart,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      href: '/admin/orders',
    },
    {
      name: 'Pending Quotations',
      value: pendingQuotations,
      icon: FileText,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      href: '/admin/quotations',
    },
    {
      name: 'Total Users',
      value: totalUsers,
      icon: Users,
      color: 'text-pink-450',
      bg: 'bg-pink-500/10',
      border: 'border-pink-500/20',
      href: '/admin/users',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard Overview</h1>
        <p className="text-sm text-slate-450 mt-1">
          Real-time metrics, system status, and pending queue summaries.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.name}
              href={card.href}
              className={`block rounded-xl border ${card.border} bg-slate-900/40 p-6 shadow-sm hover:scale-[1.02] transition-transform duration-200 backdrop-blur-sm`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">{card.name}</span>
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

      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-3">Stock Warning Rule</h3>
          <p className="text-sm text-slate-450 leading-relaxed">
            All stock levels are stored internally in their respective <span className="font-semibold text-emerald-400">Base Unit</span> (e.g. grams for weight, milliliters for volume, units for count). 
            Products are flagged as <span className="text-amber-400 font-semibold">Low Stock</span> if their inventory level falls below <span className="text-slate-200 font-semibold">100.00</span> units.
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">System Quick Actions</h3>
            <p className="text-xs text-slate-450">Jump straight into configuration tasks.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Link href="/admin/products?new=true" className="flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-500 py-3 px-4 text-xs font-semibold text-white transition-colors">
              Add New Product
            </Link>
            <Link href="/admin/users" className="flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 py-3 px-4 text-xs font-semibold text-white transition-colors border border-slate-700">
              Register New User
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

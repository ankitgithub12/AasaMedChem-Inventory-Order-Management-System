'use client'

import React, { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/lib/cart-context'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  Users,
  LogOut,
  Menu,
  X,
  User,
  ClipboardList,
  FlaskConical
} from 'lucide-react'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const { sellerCart, buyerCart } = useCart()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <FlaskConical className="h-10 w-10 animate-pulse text-emerald-500" />
          <p className="text-sm text-slate-400">Loading your space...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <>{children}</>
  }

  const role = session.user.role
  const name = session.user.name
  const company = session.user.companyName

  interface NavItem {
    name: string
    path: string
    icon: React.ComponentType<any>
    badge?: number | string
  }

  // Navigation config per role
  const navItems: NavItem[] = (({
    ADMIN: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Products', path: '/admin/products', icon: Package },
      { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
      { name: 'Quotations', path: '/admin/quotations', icon: FileText },
      { name: 'User Management', path: '/admin/users', icon: Users },
    ],
    SELLER: [
      { name: 'Products', path: '/seller/products', icon: Package },
      {
        name: 'Cart',
        path: '/seller/cart',
        icon: ShoppingCart,
        badge: sellerCart.length > 0 ? sellerCart.length : undefined
      },
      { name: 'Orders', path: '/seller/orders', icon: ClipboardList },
    ],
    BUYER: [
      { name: 'Dashboard', path: '/buyer/dashboard', icon: LayoutDashboard },
      { name: 'Products', path: '/buyer/products', icon: Package },
      {
        name: 'Quote Request',
        path: '/buyer/quote-request',
        icon: FileText,
        badge: buyerCart.length > 0 ? buyerCart.length : undefined
      },
      { name: 'Quotations', path: '/buyer/quotations', icon: ClipboardList },
      { name: 'Profile', path: '/buyer/profile', icon: User },
    ],
  } as Record<string, NavItem[]>)[role]) || []

  const roleLabels = {
    ADMIN: 'Administrator',
    SELLER: 'Sales Representative',
    BUYER: 'Buyer Portal',
  }

  const toggleMobile = () => setIsMobileOpen(!isMobileOpen)

  const SidebarContent = () => (
    <div className="flex h-full flex-col justify-between bg-slate-900 border-r border-slate-800 text-slate-200">
      <div className="px-4 py-6">
        <Link href="/" className="flex items-center gap-2 px-2 py-1">
          <FlaskConical className="h-7 w-7 text-emerald-500" />
          <span className="text-xl font-bold tracking-tight text-white">AasaMedChem</span>
        </Link>

        {/* User Card */}
        <div className="mt-6 rounded-xl bg-slate-950/40 p-4 border border-slate-800/60">
          <p className="text-sm font-semibold text-white truncate">{name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{roleLabels[role]}</p>
          {company && (
            <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider mt-1 truncate">
              {company}
            </p>
          )}
        </div>

        {/* Nav Links */}
        <nav className="mt-8 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600/10 text-emerald-400 border-l-2 border-emerald-500 font-semibold'
                    : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-850">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-400 transition-all hover:bg-rose-500/10 hover:text-rose-300"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 md:block shrink-0">
        <div className="sticky top-0 h-screen">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Header / Sidebar */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 backdrop-blur-md md:hidden">
          <Link href="/" className="flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-emerald-500" />
            <span className="text-lg font-bold tracking-tight text-white">AasaMedChem</span>
          </Link>
          <button
            onClick={toggleMobile}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
          >
            {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        {isMobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={toggleMobile} />
            {/* Menu drawer */}
            <div className="fixed inset-y-0 left-0 w-64 shadow-2xl">
              <SidebarContent />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/lib/cart-context'
import { toast } from 'sonner'
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
  FlaskConical,
  Bell,
  CheckCheck
} from 'lucide-react'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const { sellerCart, buyerCart } = useCart()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [isNotifOpen, setIsNotifOpen] = useState(false)

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, ctx.currentTime)
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.5)
    } catch (e) {
      console.error("Audio beep failed:", e)
    }
  }

  useEffect(() => {
    if (!session) return

    const fetchNotifications = async (isInitial = false) => {
      try {
        const res = await fetch('/api/notifications')
        if (!res.ok) return
        const data = await res.json()
        
        setNotifications(prev => {
          const prevUnreadIds = new Set(prev.filter(n => !n.isRead).map(n => n.id))
          const currentUnread = data.filter((n: any) => !n.isRead)
          
          if (!isInitial) {
            const newUnread = currentUnread.filter((n: any) => !prevUnreadIds.has(n.id))
            if (newUnread.length > 0) {
              playBeep()
              newUnread.forEach((n: any) => {
                toast(n.title, {
                  description: n.message,
                  action: n.link ? {
                    label: 'View',
                    onClick: () => window.location.href = n.link
                  } : undefined,
                  duration: 6000,
                })
              })
            }
          }
          return data
        })
      } catch (e) {
        console.error("Error fetching notifications:", e)
      }
    }

    fetchNotifications(true)
    const interval = setInterval(() => fetchNotifications(), 6000)
    return () => clearInterval(interval)
  }, [session])

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
      { name: 'Profile', path: '/admin/profile', icon: User },
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
      { name: 'Profile', path: '/seller/profile', icon: User },
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

  const NotificationBell = () => {
    const unreadCount = notifications.filter(n => !n.isRead).length

    const markAsRead = async (id: string, link?: string) => {
      try {
        await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })
        
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
        )
        
        setIsNotifOpen(false)
        if (link) {
          window.location.href = link
        }
      } catch (e) {
        console.error(e)
      }
    }

    const markAllAsRead = async () => {
      try {
        await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ all: true }),
        })
        
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      } catch (e) {
        console.error(e)
      }
    }

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsNotifOpen(!isNotifOpen)}
          className="relative rounded-full p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-all focus:outline-none"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-slate-950">
              {unreadCount}
            </span>
          )}
        </button>

        {isNotifOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
            
            <div className="absolute right-0 mt-2.5 w-80 sm:w-96 max-h-[480px] overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl z-50 flex flex-col font-sans">
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-4 py-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Notifications</h4>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-350 flex items-center gap-1 transition-all"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 max-h-[360px] bg-slate-900/50">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <Bell className="mx-auto h-8 w-8 text-slate-700 mb-2" />
                    <p className="text-xs">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id, n.link || undefined)}
                      className={`flex flex-col gap-1 p-3.5 text-left cursor-pointer transition-all hover:bg-slate-850/40 ${
                        !n.isRead ? 'bg-slate-950/40' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-xs font-bold ${!n.isRead ? 'text-white' : 'text-slate-300'}`}>
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                        )}
                      </div>
                      <span className="text-xs text-slate-400 leading-normal">
                        {n.message}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-1">
                        {new Date(n.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        }) + ' • ' + new Date(n.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short'
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

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

      {/* Main Content Container */}
      <div className="flex flex-1 flex-col">
        {/* Shared Sticky Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMobile}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-200 md:hidden"
            >
              {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm font-semibold text-emerald-450 uppercase tracking-wider">
                {roleLabels[role]}
              </span>
            </div>
            <div className="md:hidden flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-emerald-500" />
              <span className="font-bold text-white text-sm">AasaMedChem</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
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

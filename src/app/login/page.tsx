'use client'

import React, { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { KeyRound, Mail, AlertCircle, Loader2 } from 'lucide-react'


export default function LoginPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role) {
      const role = session.user.role
      if (role === 'ADMIN') router.push('/admin/dashboard')
      else if (role === 'SELLER') router.push('/seller/products')
      else if (role === 'BUYER') router.push('/buyer/dashboard')
    }
  }, [session, status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!email || !password) {
      setError('Please fill in all fields.')
      setIsLoading(false)
      return
    }

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (res?.error) {
        setError('Invalid email or password. Please try again.')
        setIsLoading(false)
      } else {
        // Redirection is handled by the useEffect above once session updates,
        // but we can also fetch session manually or force page reload to trigger middleware.
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred.')
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md">
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
            AasaMedChem Portal
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Inventory & Order Management System
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-400 border border-rose-500/20">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4 rounded-md">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-slate-800 bg-slate-950/60 py-3 pl-10 pr-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                  placeholder="admin@aasa.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <KeyRound className="h-5 w-5" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-slate-800 bg-slate-950/60 py-3 pl-10 pr-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-lg border border-transparent bg-emerald-600 py-3 px-4 text-sm font-semibold text-white transition-all hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-slate-400 mt-4">
          Don't have an account?{' '}
          <Link href="/register" className="font-semibold text-emerald-400 hover:text-emerald-300 transition-all">
            Register here
          </Link>
        </div>

        <div className="mt-6 rounded-lg border border-slate-800/60 bg-slate-950/40 p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
            Demo Credentials
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-400">
            <li>
              <span className="font-semibold text-slate-300">Admin:</span> admin@aasa.com / admin123
            </li>
            <li>
              <span className="font-semibold text-slate-300">Seller:</span> seller@aasa.com / seller123
            </li>
            <li>
              <span className="font-semibold text-slate-300">Buyer:</span> buyer@aasa.com / buyer123
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

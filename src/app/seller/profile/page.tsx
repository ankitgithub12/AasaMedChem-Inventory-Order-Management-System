'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { User, Mail, Phone, KeyRound, Loader2, Save, Eye, EyeOff } from 'lucide-react'

export default function SellerProfilePage() {
  const { data: session, update } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: '', color: 'bg-slate-800', barWidth: 'w-0', textColor: 'text-slate-500' }
    let score = 0
    if (pwd.length >= 6) score += 1
    if (pwd.length >= 8) score += 1
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1
    if (/\d/.test(pwd)) score += 1
    if (/[^A-Za-50-9]/.test(pwd)) score += 1 // matches any non-alphanumeric character
    
    if (pwd.length < 6 || score < 2) {
      return { label: 'Weak', color: 'bg-rose-500', barWidth: 'w-1/3', textColor: 'text-rose-455' }
    } else if (score >= 2 && score < 4) {
      return { label: 'Medium', color: 'bg-amber-500', barWidth: 'w-2/3', textColor: 'text-amber-400' }
    } else {
      return { label: 'Strong', color: 'bg-emerald-500', barWidth: 'w-full', textColor: 'text-emerald-400' }
    }
  }
  const strength = getPasswordStrength(password)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/profile')
        if (!res.ok) throw new Error('Could not load profile.')
        const data = await res.json()
        setName(data.name || '')
        setEmail(data.email || '')
        setPhone(data.phone || '')
      } catch (err: any) {
        toast.error(err.message || 'Error loading profile.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    // Validations
    if (!name || !email) {
      toast.error('Name and email are required fields.')
      setIsSaving(false)
      return
    }

    if (password) {
      if (password.length < 6) {
        toast.error('Password must be at least 6 characters long.')
        setIsSaving(false)
        return
      }
      if (password !== confirmPassword) {
        toast.error('Passwords do not match.')
        setIsSaving(false)
        return
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address.')
      setIsSaving(false)
      return
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: phone || null,
          password: password || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update profile.')

      // Update nextauth session state
      await update({
        name,
      })

      toast.success('Profile updated successfully!')
      setPassword('')
      setConfirmPassword('')
      setShowPassword(false)
      setShowConfirmPassword(false)
    } catch (err: any) {
      toast.error(err.message || 'Error updating profile.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <User className="h-8 w-8 text-emerald-500" />
          Seller Profile
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your personal contact details and login credentials.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-sm">
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-600">
                <Mail className="h-4.5 w-4.5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-600">
                <Phone className="h-4.5 w-4.5" />
              </span>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <hr className="sm:col-span-2 border-slate-800 my-2" />

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              New Password (optional)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-600">
                <KeyRound className="h-4.5 w-4.5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-10 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-350 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-450 uppercase tracking-wider font-semibold">Strength:</span>
                  <span className={`font-bold uppercase tracking-wider ${strength.textColor}`}>{strength.label}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                  <div className={`h-full transition-all duration-355 ${strength.color} ${strength.barWidth}`} />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-600">
                <KeyRound className="h-4.5 w-4.5" />
              </span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-10 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-350 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2.5 px-5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <>
                <Save className="h-4.5 w-4.5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

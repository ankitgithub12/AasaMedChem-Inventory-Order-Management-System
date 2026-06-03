'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Users, Plus, Mail, Shield, Building, Phone, KeyRound, Loader2, Eye, EyeOff } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'SELLER' | 'BUYER'
  companyName: string | null
  phone: string | null
  createdAt: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form Fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'ADMIN' | 'SELLER' | 'BUYER'>('SELLER')
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')

  const [showPassword, setShowPassword] = useState(false)

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: '', color: 'bg-slate-800', barWidth: 'w-0', textColor: 'text-slate-500' }
    let score = 0
    if (pwd.length >= 6) score += 1
    if (pwd.length >= 8) score += 1
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1
    if (/\d/.test(pwd)) score += 1
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1
    
    if (pwd.length < 6 || score < 2) {
      return { label: 'Weak', color: 'bg-rose-500', barWidth: 'w-1/3', textColor: 'text-rose-455' }
    } else if (score >= 2 && score < 4) {
      return { label: 'Medium', color: 'bg-amber-500', barWidth: 'w-2/3', textColor: 'text-amber-400' }
    } else {
      return { label: 'Strong', color: 'bg-emerald-500', barWidth: 'w-full', textColor: 'text-emerald-400' }
    }
  }
  const strength = getPasswordStrength(password)

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()
      setUsers(data)
    } catch (err: any) {
      toast.error(err.message || 'Could not load users.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    // Form validations
    if (!name || !email || !password || !role) {
      toast.error('Please fill in all required fields.')
      setIsSaving(false)
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.')
      setIsSaving(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address.')
      setIsSaving(false)
      return
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          companyName: role === 'BUYER' ? companyName : null,
          phone: phone || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create user')

      toast.success(`User ${name} registered successfully!`)
      
      // Reset state
      setName('')
      setEmail('')
      setPassword('')
      setShowPassword(false)
      setRole('SELLER')
      setCompanyName('')
      setPhone('')
      setIsDialogOpen(false)
      
      // Refresh list
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message || 'Could not register user.')
    } finally {
      setIsSaving(false)
    }
  }

  const roleColors = {
    ADMIN: 'bg-rose-500/10 text-rose-450 border border-rose-500/20',
    SELLER: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    BUYER: 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Users className="h-8 w-8 text-emerald-500" />
            User Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Create, view, and assign roles for admins, sales team, and buyers.
          </p>
        </div>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2.5 px-4 text-sm font-semibold text-white transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-white">No Users Found</h3>
          <p className="text-sm text-slate-400 mt-1">Register a new user to populate this list.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-850 bg-slate-900/20 overflow-hidden backdrop-blur-sm">
          <Table>
            <TableHeader className="bg-slate-950/40">
              <TableRow className="border-slate-850 hover:bg-transparent">
                <TableHead className="text-slate-455">Name</TableHead>
                <TableHead className="text-slate-455">Email</TableHead>
                <TableHead className="text-slate-455">Role</TableHead>
                <TableHead className="text-slate-455">Company</TableHead>
                <TableHead className="text-slate-455">Phone</TableHead>
                <TableHead className="text-slate-455">Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-slate-850 hover:bg-slate-900/30">
                  <TableCell className="font-semibold text-white">{user.name}</TableCell>
                  <TableCell className="text-slate-300">{user.email}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded px-2.5 py-0.5 text-xs font-semibold ${roleColors[user.role]}`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-350">{user.companyName || '—'}</TableCell>
                  <TableCell className="text-slate-350">{user.phone || '—'}</TableCell>
                  <TableCell className="text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Register New User</DialogTitle>
            <DialogDescription className="text-slate-400">
              Assign a role and register credentials for the user.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegister} className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-650">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@aasa.com"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Password * (min 6 chars)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-650">
                  <KeyRound className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-10 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-350 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Role *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="ADMIN">Admin</option>
                <option value="SELLER">Seller (Internal Sales)</option>
                <option value="BUYER">Buyer (External Customer)</option>
              </select>
            </div>

            {role === 'BUYER' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Company Name *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-650">
                    <Building className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Test Pharma Co."
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Phone Number (optional)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-650">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-lg border border-slate-850 px-4 py-2 text-sm text-slate-350 hover:bg-slate-800 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

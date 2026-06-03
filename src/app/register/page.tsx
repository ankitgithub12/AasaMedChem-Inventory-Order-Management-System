'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { UserPlus, Mail, Shield, Building, Phone, KeyRound, Loader2, ArrowLeft, Check, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'SELLER' | 'BUYER'>('BUYER')
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Validation States
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Password checklist states
  const hasMinLength = password.length >= 6
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /\d/.test(password)

  const validateField = (field: string, value: string, currentRole?: 'SELLER' | 'BUYER') => {
    let err = ''
    const activeRole = currentRole || role

    if (field === 'name') {
      if (!value.trim()) err = 'Name is required'
      else if (value.trim().length < 3) err = 'Name must be at least 3 characters'
    } else if (field === 'email') {
      if (!value) err = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) err = 'Enter a valid email address'
    } else if (field === 'phone') {
      if (value && !/^\+?[0-9\s\-()]{7,18}$/.test(value)) {
        err = 'Enter a valid phone number'
      }
    } else if (field === 'companyName') {
      if (activeRole === 'BUYER' && !value.trim()) {
        err = 'Company name is required for buyers'
      }
    } else if (field === 'password') {
      if (!value) err = 'Password is required'
      else if (value.length < 6) err = 'Password must be at least 6 characters'
      else if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) {
        err = 'Password must contain both letters and numbers'
      }
    } else if (field === 'confirmPassword') {
      if (!value) err = 'Confirm password is required'
      else if (value !== password) err = 'Passwords do not match'
    }
    return err
  }

  const handleChange = (field: string, value: string) => {
    // Update states
    if (field === 'name') setName(value)
    if (field === 'email') setEmail(value)
    if (field === 'phone') setPhone(value)
    if (field === 'companyName') setCompanyName(value)
    if (field === 'password') {
      setPassword(value)
      // If confirmPassword is empty and user types password, don't trigger error yet
      if (touched['confirmPassword']) {
        const confirmErr = confirmPassword === value ? '' : 'Passwords do not match'
        setErrors(prev => ({ ...prev, confirmPassword: confirmErr }))
      }
    }
    if (field === 'confirmPassword') setConfirmPassword(value)

    // Run live validation if touched
    if (touched[field]) {
      const err = validateField(field, value)
      setErrors(prev => ({ ...prev, [field]: err }))
    }
  }

  const handleBlur = (field: string, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const err = validateField(field, value)
    setErrors(prev => ({ ...prev, [field]: err }))
  }

  const handleRoleChange = (newRole: 'SELLER' | 'BUYER') => {
    setRole(newRole)
    setSubmitError('')
    
    // Clear companyName error if switching to SELLER
    if (newRole === 'SELLER') {
      setErrors(prev => {
        const { companyName: _, ...rest } = prev
        return rest
      })
      setCompanyName('')
    } else {
      // Revalidate companyName if switching to BUYER
      const err = validateField('companyName', companyName, 'BUYER')
      if (err) {
        setErrors(prev => ({ ...prev, companyName: err }))
      }
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')

    // Touch all fields to trigger visual errors if empty
    const fieldsToValidate = ['name', 'email', 'password', 'confirmPassword', 'phone']
    if (role === 'BUYER') fieldsToValidate.push('companyName')

    const newTouched: Record<string, boolean> = {}
    const newErrors: Record<string, string> = {}

    fieldsToValidate.forEach(field => {
      newTouched[field] = true
      let val = ''
      if (field === 'name') val = name
      if (field === 'email') val = email
      if (field === 'phone') val = phone
      if (field === 'companyName') val = companyName
      if (field === 'password') val = password
      if (field === 'confirmPassword') val = confirmPassword

      const err = validateField(field, val)
      if (err) newErrors[field] = err
    })

    setTouched(newTouched)
    setErrors(newErrors)

    const hasErrors = Object.values(newErrors).some(err => !!err)
    if (hasErrors) {
      toast.error('Please correct the validation errors on the form.')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/register', {
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
      if (!res.ok) throw new Error(data.error || 'Failed to register.')

      toast.success('Registration successful! Please log in.')
      router.push('/login')
    } catch (err: any) {
      setSubmitError(err.message || 'Could not complete registration.')
      toast.error(err.message || 'Could not complete registration.')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-xl space-y-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md">
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <UserPlus className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
            Create Account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Join the AasaMedChem Portal as a Buyer or Seller
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="relative grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-1 border border-slate-850">
          <button
            type="button"
            onClick={() => handleRoleChange('BUYER')}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
              role === 'BUYER'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            <Building className="h-4 w-4" />
            Buyer
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('SELLER')}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
              role === 'SELLER'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            <Shield className="h-4 w-4" />
            Seller
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleRegister}>
          {submitError && (
            <div className="flex items-start gap-2.5 rounded-lg bg-rose-500/10 p-3.5 text-sm text-rose-450 border border-rose-500/20">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={(e) => handleBlur('name', e.target.value)}
                placeholder="John Doe"
                className={`block w-full rounded-lg border bg-slate-950/60 py-2.5 px-3 text-white placeholder-slate-600 focus:outline-none focus:ring-1 sm:text-sm transition-all ${
                  touched.name && errors.name
                    ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500'
                }`}
              />
              {touched.name && errors.name && (
                <p className="mt-1 text-xs text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" /> {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-600">
                  <Mail className="h-4.5 w-4.5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={(e) => handleBlur('email', e.target.value)}
                  placeholder="john@company.com"
                  className={`block w-full rounded-lg border bg-slate-950/60 py-2.5 pl-9 pr-3 text-white placeholder-slate-600 focus:outline-none focus:ring-1 sm:text-sm transition-all ${
                    touched.email && errors.email
                      ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500'
                  }`}
                />
              </div>
              {touched.email && errors.email && (
                <p className="mt-1 text-xs text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" /> {errors.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-600">
                  <Phone className="h-4.5 w-4.5" />
                </span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  onBlur={(e) => handleBlur('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className={`block w-full rounded-lg border bg-slate-950/60 py-2.5 pl-9 pr-3 text-white placeholder-slate-600 focus:outline-none focus:ring-1 sm:text-sm transition-all ${
                    touched.phone && errors.phone
                      ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500'
                  }`}
                />
              </div>
              {touched.phone && errors.phone ? (
                <p className="mt-1 text-xs text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" /> {errors.phone}
                </p>
              ) : (
                <p className="mt-1 text-[10px] text-slate-500">Optional</p>
              )}
            </div>

            {/* Company Name (only Buyer) */}
            {role === 'BUYER' ? (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-455 mb-1.5">
                  Company Name *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-600">
                    <Building className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    onBlur={(e) => handleBlur('companyName', e.target.value)}
                    placeholder="Acme Pharmaceuticals Ltd"
                    className={`block w-full rounded-lg border bg-slate-950/60 py-2.5 pl-9 pr-3 text-white placeholder-slate-600 focus:outline-none focus:ring-1 sm:text-sm transition-all ${
                      touched.companyName && errors.companyName
                        ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500'
                    }`}
                  />
                </div>
                {touched.companyName && errors.companyName && (
                  <p className="mt-1 text-xs text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" /> {errors.companyName}
                  </p>
                )}
              </div>
            ) : (
              <div className="sm:col-span-2 rounded-lg bg-slate-950/50 p-4 border border-slate-850">
                <p className="text-xs text-slate-400 leading-relaxed">
                  <span className="font-semibold text-emerald-450">Seller Registration:</span> You are registering as an internal sales representative. You will have full access to view, manage, and place orders on behalf of client accounts.
                </p>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-1.5">
                Password *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-600">
                  <KeyRound className="h-4.5 w-4.5" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={(e) => handleBlur('password', e.target.value)}
                  placeholder="••••••••"
                  className={`block w-full rounded-lg border bg-slate-950/60 py-2.5 pl-9 pr-3 text-white placeholder-slate-600 focus:outline-none focus:ring-1 sm:text-sm transition-all ${
                    touched.password && errors.password
                      ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500'
                  }`}
                />
              </div>
              {touched.password && errors.password && (
                <p className="mt-1 text-xs text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" /> {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-1.5">
                Confirm Password *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-600">
                  <KeyRound className="h-4.5 w-4.5" />
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  onBlur={(e) => handleBlur('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  className={`block w-full rounded-lg border bg-slate-950/60 py-2.5 pl-9 pr-3 text-white placeholder-slate-600 focus:outline-none focus:ring-1 sm:text-sm transition-all ${
                    touched.confirmPassword && errors.confirmPassword
                      ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500'
                  }`}
                />
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="mt-1 text-xs text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" /> {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Password checklist (dynamic) */}
            <div className="sm:col-span-2 rounded-lg bg-slate-950/40 p-3.5 border border-slate-850 space-y-1.5">
              <p className="text-xs font-semibold text-slate-450 uppercase tracking-wider mb-1">Password Requirements</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                    hasMinLength ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-450' : 'border-slate-800 text-slate-650'
                  }`}>
                    {hasMinLength ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : '1'}
                  </span>
                  <span className={hasMinLength ? 'text-slate-300' : 'text-slate-500'}>Min 6 characters</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                    hasLetter ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-450' : 'border-slate-800 text-slate-650'
                  }`}>
                    {hasLetter ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : '2'}
                  </span>
                  <span className={hasLetter ? 'text-slate-300' : 'text-slate-500'}>At least one letter</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                    hasNumber ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-450' : 'border-slate-800 text-slate-650'
                  }`}>
                    {hasNumber ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : '3'}
                  </span>
                  <span className={hasNumber ? 'text-slate-300' : 'text-slate-500'}>At least one number</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center items-center gap-2 rounded-lg bg-emerald-600 py-3 px-4 text-sm font-semibold text-white transition-all hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-405 mt-4 border-t border-slate-800 pt-4">
          <span>Already have an account?</span>
          <Link href="/login" className="font-semibold text-emerald-400 hover:text-emerald-350 transition-all flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

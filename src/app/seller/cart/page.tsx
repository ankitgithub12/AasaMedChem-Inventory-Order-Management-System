'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useCart } from '@/lib/cart-context'
import {
  getCompatibleUnits,
  pricePerOrderedUnit,
  toBaseUnit,
  calculateLineTotal
} from '@/lib/unit-conversion'
import {
  ShoppingCart,
  Trash2,
  ArrowRight,
  Info,
  ChevronLeft,
  Loader2,
  FileText
} from 'lucide-react'
import Link from 'next/link'

export default function SellerCartPage() {
  const router = useRouter()
  const { sellerCart, updateSellerCartItem, removeFromSellerCart, clearSellerCart } = useCart()
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleQtyChange = (productId: string, val: string, unit: string) => {
    const qty = parseFloat(val)
    if (isNaN(qty) || qty <= 0) {
      updateSellerCartItem(productId, 0, unit)
      return
    }
    updateSellerCartItem(productId, qty, unit)
  }

  const handleUnitChange = (productId: string, qty: number, newUnit: string) => {
    updateSellerCartItem(productId, qty, newUnit)
  }

  const getGrandTotal = () => {
    return sellerCart.reduce((sum, item) => {
      const price = item.basePrice || 0
      return sum + calculateLineTotal(item.quantity, item.unit, price)
    }, 0)
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()

    if (sellerCart.length === 0) return

    // Form validations
    for (const item of sellerCart) {
      if (item.quantity <= 0) {
        toast.error(`Please enter a valid quantity for ${item.name}`)
        return
      }
    }

    setIsSubmitting(true)

    const payload = {
      notes: notes || null,
      items: sellerCart.map((item) => ({
        productId: item.productId,
        orderedQty: item.quantity,
        orderedUnit: item.unit,
      })),
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order.')
      }

      toast.success('Sales order placed successfully!')
      clearSellerCart()
      router.push('/seller/orders')
    } catch (err: any) {
      toast.error(err.message || 'Error placing order.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (sellerCart.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-emerald-500" />
            Shopping Cart
          </h1>
        </div>

        <div className="rounded-xl border border-dashed border-slate-850 p-16 text-center bg-slate-900/5">
          <ShoppingCart className="mx-auto h-16 w-16 text-slate-700 mb-4" />
          <h3 className="text-xl font-semibold text-white">Your Cart is Empty</h3>
          <p className="text-sm text-slate-450 mt-2 max-w-sm mx-auto">
            You haven&apos;t added any items to your order cart yet. Go to the products catalog to select items.
          </p>
          <div className="mt-6">
            <Link
              href="/seller/products"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2.5 px-5 text-sm font-semibold text-white transition-colors"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <ShoppingCart className="h-8 w-8 text-emerald-500" />
          Shopping Cart
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review items, select units, check conversion rates, and finalize order checkout.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart Item list */}
        <div className="lg:col-span-2 space-y-4">
          {sellerCart.map((item) => {
            const compatibleUnits = getCompatibleUnits(item.baseUnit)
            const price = item.basePrice || 0
            const lineTotal = calculateLineTotal(item.quantity, item.unit, price)
            const effPrice = pricePerOrderedUnit(price, item.unit)
            const convertedQty = toBaseUnit(item.quantity, item.unit)

            return (
              <div
                key={item.productId}
                className="rounded-xl border border-slate-855 bg-slate-900/20 p-5 shadow-sm backdrop-blur-sm hover:border-slate-800 transition-all flex flex-col justify-between sm:flex-row gap-4"
              >
                <div className="flex-1 space-y-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 px-2 py-0.5 rounded bg-slate-800">
                      {item.category || 'General'}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5">{item.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{item.sku}</p>
                  </div>

                  {/* Calculations breakdown block */}
                  <div className="grid gap-2 grid-cols-2 rounded-lg bg-slate-950/40 border border-slate-850/60 p-3">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Base Rate</span>
                      <span className="text-xs font-mono font-semibold text-slate-300">
                        ₹{price.toFixed(4)}/{item.baseUnit}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Effective Rate</span>
                      <span className="text-xs font-mono font-semibold text-emerald-400">
                        ₹{effPrice.toLocaleString('en-IN', { maximumFractionDigits: 4 })}/{item.unit}
                      </span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-850/60 text-[10px] text-slate-450 flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5 text-emerald-450" />
                      <span>
                        Conversion: <span className="font-semibold text-slate-300 font-mono">{item.quantity} {item.unit}</span> ={' '}
                        <span className="font-semibold text-emerald-400 font-mono">{convertedQty} {item.baseUnit}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col sm:items-end justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    {/* Quantity input */}
                    <div className="w-20">
                      <input
                        type="number"
                        step="0.0001"
                        min="0.0001"
                        value={item.quantity || ''}
                        onChange={(e) => handleQtyChange(item.productId, e.target.value, item.unit)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 py-1.5 px-2.5 text-xs text-white text-center font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    {/* Unit Select */}
                    <div>
                      <select
                        value={item.unit}
                        onChange={(e) => handleUnitChange(item.productId, item.quantity, e.target.value)}
                        className="rounded-lg border border-slate-800 bg-slate-950 py-1.5 px-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      >
                        {compatibleUnits.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center sm:items-end flex-row sm:flex-col gap-3 justify-end">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Line Total</span>
                      <span className="text-sm font-extrabold text-white font-mono">
                        ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <button
                      onClick={() => removeFromSellerCart(item.productId)}
                      className="rounded p-2 text-rose-450 hover:bg-rose-500/10 hover:text-rose-350 transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Checkout Summary panel */}
        <div>
          <div className="rounded-xl border border-slate-855 bg-slate-900/20 p-6 shadow-sm backdrop-blur-sm space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-slate-850 pb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-500" />
              Order Checkout
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Items:</span>
                <span className="font-semibold text-white">{sellerCart.length}</span>
              </div>
              <div className="flex justify-between border-t border-slate-850/60 pt-3">
                <span className="text-slate-400 font-semibold">Grand Total:</span>
                <span className="text-lg font-black text-emerald-450 font-mono">
                  ₹{getGrandTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">
                Sales Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Include shipping instructions, priority level, customer comments..."
                rows={3}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none resize-none"
              />
            </div>

            <button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-3 px-4 text-sm font-semibold text-white transition-all disabled:opacity-50 hover:scale-[1.01]"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Place Sales Order
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

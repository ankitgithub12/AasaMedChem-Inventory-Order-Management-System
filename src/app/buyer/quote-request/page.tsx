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
  FileText,
  Trash2,
  Send,
  Info,
  ChevronLeft,
  Loader2,
  Lock
} from 'lucide-react'
import Link from 'next/link'

export default function BuyerQuoteRequestPage() {
  const router = useRouter()
  const { buyerCart, updateBuyerCartItem, removeFromBuyerCart, clearBuyerCart } = useCart()
  const [buyerNotes, setBuyerNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleQtyChange = (productId: string, val: string, unit: string) => {
    const qty = parseFloat(val)
    if (isNaN(qty) || qty <= 0) {
      updateBuyerCartItem(productId, 0, unit)
      return
    }
    updateBuyerCartItem(productId, qty, unit)
  }

  const handleUnitChange = (productId: string, qty: number, newUnit: string) => {
    updateBuyerCartItem(productId, qty, newUnit)
  }

  const getEstimatedGrandTotal = () => {
    return buyerCart.reduce((sum, item) => {
      if (!item.isPricePublic || item.basePrice === null) return sum
      const price = parseFloat(item.basePrice.toString())
      return sum + calculateLineTotal(item.quantity, item.unit, price)
    }, 0)
  }

  const hasPublicPricesInCart = () => {
    return buyerCart.some((item) => item.isPricePublic && item.basePrice !== null)
  }

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()

    if (buyerCart.length === 0) return

    // Form validations
    for (const item of buyerCart) {
      if (item.quantity <= 0) {
        toast.error(`Please enter a valid quantity for ${item.name}`)
        return
      }
    }

    setIsSubmitting(true)

    const payload = {
      buyerNotes: buyerNotes || null,
      items: buyerCart.map((item) => ({
        productId: item.productId,
        requestedQty: item.quantity,
        requestedUnit: item.unit,
      })),
    }

    try {
      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit quote request.')
      }

      toast.success('Quotation request submitted successfully!')
      clearBuyerCart()
      router.push('/buyer/quotations')
    } catch (err: any) {
      toast.error(err.message || 'Error submitting request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (buyerCart.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <FileText className="h-8 w-8 text-emerald-500" />
            Quote Request Worksheet
          </h1>
        </div>

        <div className="rounded-xl border border-dashed border-slate-850 p-16 text-center bg-slate-900/5">
          <FileText className="mx-auto h-16 w-16 text-slate-700 mb-4" />
          <h3 className="text-xl font-semibold text-white">Worksheet is Empty</h3>
          <p className="text-sm text-slate-450 mt-2 max-w-sm mx-auto">
            You haven&apos;t added any products to your quotation request list. Go to the product catalog to select items.
          </p>
          <div className="mt-6">
            <Link
              href="/buyer/products"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2.5 px-5 text-sm font-semibold text-white transition-colors"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
              Browse Catalog
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
          <FileText className="h-8 w-8 text-emerald-500" />
          Quote Request Worksheet
        </h1>
        <p className="text-sm text-slate-450 mt-1">
          Review items, specify requested package sizes and quantities, and submit for pricing review.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart items list */}
        <div className="lg:col-span-2 space-y-4">
          {buyerCart.map((item) => {
            const compatibleUnits = getCompatibleUnits(item.baseUnit)
            const isPublic = item.isPricePublic && item.basePrice !== null
            const price = isPublic ? parseFloat(item.basePrice!.toString()) : 0
            const lineTotal = isPublic ? calculateLineTotal(item.quantity, item.unit, price) : 0
            const effPrice = isPublic ? pricePerOrderedUnit(price, item.unit) : 0
            const baseQty = toBaseUnit(item.quantity, item.unit)

            return (
              <div
                key={item.productId}
                className="rounded-xl border border-slate-855 bg-slate-900/20 p-5 shadow-sm backdrop-blur-sm hover:border-slate-805 transition-all flex flex-col justify-between sm:flex-row gap-4"
              >
                <div className="flex-1 space-y-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 px-2 py-0.5 rounded bg-slate-805">
                      {item.category || 'General'}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5">{item.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{item.sku}</p>
                  </div>

                  {/* Pricing estimation box */}
                  {isPublic ? (
                    <div className="grid gap-2 grid-cols-2 rounded-lg bg-slate-950/40 border border-slate-850/60 p-3">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Indicative Rate</span>
                        <span className="text-xs font-mono font-semibold text-slate-350">
                          ₹{price.toFixed(4)}/{item.baseUnit}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Effective Rate</span>
                        <span className="text-xs font-mono font-semibold text-emerald-450">
                          ₹{effPrice.toLocaleString('en-IN', { maximumFractionDigits: 4 })}/{item.unit}
                        </span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-slate-850/60 text-[10px] text-slate-450 flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5 text-emerald-450" />
                        <span>
                          Conversion: <span className="font-semibold text-slate-300 font-mono">{item.quantity} {item.unit}</span> ={' '}
                          <span className="font-semibold text-emerald-400 font-mono">{baseQty} {item.baseUnit}</span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-slate-955/45 border border-slate-805/45 p-3 flex gap-2.5 items-center">
                      <Lock className="h-4 w-4 text-amber-500" />
                      <span className="text-xs text-slate-450">
                        Our administrative team will provide custom pricing upon review.
                      </span>
                    </div>
                  )}
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
                    {/* Unit Selector */}
                    <div>
                      <select
                        value={item.unit}
                        onChange={(e) => handleUnitChange(item.productId, item.quantity, e.target.value)}
                        className="rounded-lg border border-slate-800 bg-slate-955 py-1.5 px-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
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
                      <span className="text-[10px] text-slate-505 block uppercase font-bold tracking-wider">Estimated Total</span>
                      <span className="text-sm font-extrabold text-white font-mono">
                        {isPublic ? (
                          `₹${lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                        ) : (
                          <span className="text-xs text-slate-500 italic">TBD</span>
                        )}
                      </span>
                    </div>
                    <button
                      onClick={() => removeFromBuyerCart(item.productId)}
                      className="rounded p-2 text-rose-455 hover:bg-rose-500/10 hover:text-rose-350 transition-colors"
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

        {/* Worksheet Summary */}
        <div>
          <div className="rounded-xl border border-slate-855 bg-slate-900/20 p-6 shadow-sm backdrop-blur-sm space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Send className="h-5 w-5 text-emerald-500" />
              Submit Worksheet
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Items:</span>
                <span className="font-semibold text-white">{buyerCart.length}</span>
              </div>
              
              {hasPublicPricesInCart() && (
                <div className="flex justify-between border-t border-slate-850/60 pt-3">
                  <span className="text-slate-400 font-semibold">Est. Public Total:</span>
                  <span className="text-base font-extrabold text-emerald-450 font-mono">
                    ₹{getEstimatedGrandTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">
                Quotation Notes / Requests (optional)
              </label>
              <textarea
                value={buyerNotes}
                onChange={(e) => setBuyerNotes(e.target.value)}
                placeholder="Include shipping instructions, chemical purity grade requirements, or target rates..."
                rows={4}
                className="w-full rounded-lg border border-slate-800 bg-slate-955 py-2 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none resize-none"
              />
            </div>

            <button
              onClick={handleSubmitRequest}
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-3 px-4 text-sm font-semibold text-white transition-all disabled:opacity-50 hover:scale-[1.01]"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Submit Quote Request
                  <Send className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

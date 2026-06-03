'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  Calendar,
  Building,
  User,
  Info,
  DollarSign,
  AlertCircle
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface QuotationItem {
  id: string
  requestedUnit: string
  requestedQuantity: number | string
  baseQuantity: number | string
  quotedUnitPrice: number | string | null
  lineTotal: number | string | null
  product: {
    name: string
    sku: string
    baseUnit: string
    basePrice: number | string
  }
}

interface Quotation {
  id: string
  buyerId: string
  status: 'PENDING' | 'REVIEWED' | 'QUOTED' | 'CONFIRMED' | 'REJECTED'
  buyerNotes: string | null
  adminNotes: string | null
  quotedAmount: number | string | null
  createdAt: string
  buyer: {
    name: string
    email: string
    companyName: string | null
    phone: string | null
  }
  items: QuotationItem[]
}

export default function AdminQuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedQuotes, setExpandedQuotes] = useState<Record<string, boolean>>({})

  // Quoting states
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [quotePrices, setQuotePrices] = useState<Record<string, string>>({}) // itemId -> priceString
  const [quoteStatus, setQuoteStatus] = useState<'REVIEWED' | 'QUOTED' | 'REJECTED'>('QUOTED')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchQuotations = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/quotations')
      if (!res.ok) throw new Error('Failed to fetch quotations')
      const data = await res.json()
      setQuotations(data)
    } catch (err: any) {
      toast.error(err.message || 'Error loading quotations.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchQuotations()
  }, [])

  const toggleExpand = (id: string) => {
    setExpandedQuotes((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const startQuoting = (quote: Quotation) => {
    setActiveQuoteId(quote.id)
    setAdminNotes(quote.adminNotes || '')
    setQuoteStatus('QUOTED')
    
    // Pre-populate prices with current quoted prices OR product base prices as suggestions
    const prices: Record<string, string> = {}
    quote.items.forEach((item) => {
      prices[item.id] = item.quotedUnitPrice?.toString() || parseFloat(item.product.basePrice.toString()).toString()
    })
    setQuotePrices(prices)
  }

  const handlePriceChange = (itemId: string, value: string) => {
    setQuotePrices((prev) => ({ ...prev, [itemId]: value }))
  }

  // Calculate live line total for an item
  const getItemLineTotal = (item: QuotationItem) => {
    const baseQty = parseFloat(item.baseQuantity.toString())
    const priceStr = quotePrices[item.id]
    const price = parseFloat(priceStr || '0')
    if (isNaN(price) || price < 0) return 0
    return baseQty * price
  }

  // Calculate live grand total
  const getLiveGrandTotal = (quote: Quotation) => {
    return quote.items.reduce((sum, item) => sum + getItemLineTotal(item), 0)
  }

  const handleSaveQuote = async (e: React.FormEvent, quote: Quotation) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Construct pricing array for items
    const itemsPayload = []

    if (quoteStatus === 'QUOTED') {
      for (const item of quote.items) {
        const priceStr = quotePrices[item.id]
        const price = parseFloat(priceStr)
        if (isNaN(price) || price < 0) {
          toast.error(`Please enter a valid price for product ${item.product.name}`)
          setIsSubmitting(false)
          return
        }
        itemsPayload.push({
          itemId: item.id,
          quotedUnitPrice: price,
        })
      }
    }

    try {
      const res = await fetch(`/api/quotations/${quote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: quoteStatus,
          adminNotes: adminNotes || null,
          items: quoteStatus === 'QUOTED' ? itemsPayload : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update quotation.')

      toast.success(`Quotation updated successfully to: ${quoteStatus}`)
      setActiveQuoteId(null)
      fetchQuotations()
    } catch (err: any) {
      toast.error(err.message || 'Error updating quotation.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const statusColors = {
    PENDING: 'bg-yellow-500/10 text-yellow-450 border border-yellow-500/20',
    REVIEWED: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    QUOTED: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    CONFIRMED: 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20',
    REJECTED: 'bg-rose-500/10 text-rose-450 border border-rose-500/20',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <FileText className="h-8 w-8 text-emerald-500" />
          Buyer Quotation Requests
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review requests, input pricing worksheets, and send quotes to external customers.
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : quotations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-850 p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-650 mb-4" />
          <h3 className="text-lg font-semibold text-white">No Quotations Found</h3>
          <p className="text-sm text-slate-450 mt-1">Incoming quotation requests will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-850 bg-slate-900/20 overflow-hidden backdrop-blur-sm">
            <Table>
              <TableHeader className="bg-slate-950/40">
                <TableRow className="border-slate-850 hover:bg-transparent">
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="text-slate-450">Quotation ID</TableHead>
                  <TableHead className="text-slate-450">Buyer / Company</TableHead>
                  <TableHead className="text-slate-450">Status</TableHead>
                  <TableHead className="text-slate-450">Quoted Amount (₹)</TableHead>
                  <TableHead className="text-slate-455">Request Date</TableHead>
                  <TableHead className="text-slate-455 text-right">Worksheet</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((quote) => {
                  const isExpanded = !!expandedQuotes[quote.id]
                  const quoteDate = new Date(quote.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  const amount = quote.quotedAmount ? parseFloat(quote.quotedAmount.toString()) : null

                  return (
                    <React.Fragment key={quote.id}>
                      <TableRow className="border-slate-850 hover:bg-slate-900/30">
                        <TableCell>
                          <button
                            onClick={() => toggleExpand(quote.id)}
                            className="rounded p-1 text-slate-450 hover:bg-slate-850 hover:text-white"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-300">
                          {quote.id.slice(0, 8).toUpperCase()}...
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-semibold text-white">{quote.buyer.name}</div>
                            <div className="text-xs text-slate-450 flex items-center gap-1.5 mt-0.5">
                              <Building className="h-3 w-3 text-slate-500" />
                              {quote.buyer.companyName || 'Individual'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded px-2.5 py-0.5 text-xs font-semibold ${statusColors[quote.status]}`}>
                            {quote.status}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono font-bold text-white">
                          {amount !== null ? (
                            `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                          ) : (
                            <span className="text-xs text-slate-500 italic">Not Quoted Yet</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-400 text-xs font-medium">
                          {quoteDate}
                        </TableCell>
                        <TableCell className="text-right">
                          {['PENDING', 'REVIEWED'].includes(quote.status) ? (
                            <button
                              onClick={() => startQuoting(quote)}
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 py-1.5 px-3 text-xs font-semibold text-white transition-colors"
                            >
                              Quote Pricing
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Locked</span>
                          )}
                        </TableCell>
                      </TableRow>

                      {/* Expandable Quote Breakdown / Pricing Worksheet */}
                      {isExpanded && (
                        <TableRow className="bg-slate-950/20 border-slate-850 hover:bg-slate-950/20">
                          <TableCell colSpan={7} className="p-6">
                            <div className="space-y-4">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-850 pb-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  Quotation Worksheet details
                                </h4>
                                {quote.buyerNotes && (
                                  <div className="text-xs text-slate-450">
                                    <span className="font-semibold text-slate-350">Buyer Notes: </span>
                                    &ldquo;{quote.buyerNotes}&rdquo;
                                  </div>
                                )}
                              </div>

                              {activeQuoteId === quote.id ? (
                                /* ADMIN WORKFLOW FOR PRICING */
                                <form onSubmit={(e) => handleSaveQuote(e, quote)} className="space-y-4 rounded-xl border border-emerald-500/20 bg-slate-950/40 p-4">
                                  <h5 className="text-sm font-semibold text-white flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-emerald-400" />
                                    Active Worksheet Calculator
                                  </h5>

                                  <div className="rounded-lg border border-slate-800 overflow-hidden">
                                    <Table>
                                      <TableHeader className="bg-slate-900/60">
                                        <TableRow className="border-slate-800 hover:bg-transparent">
                                          <TableHead className="text-xs text-slate-400">Product</TableHead>
                                          <TableHead className="text-xs text-slate-400">Requested Qty</TableHead>
                                          <TableHead className="text-xs text-slate-400">Base Equivalent</TableHead>
                                          <TableHead className="text-xs text-slate-400">Internal Rate (₹/base)</TableHead>
                                          <TableHead className="text-xs text-slate-400">Quoted Rate (₹/base) *</TableHead>
                                          <TableHead className="text-xs text-slate-400 text-right">Line Total (₹)</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {quote.items.map((item) => {
                                          const reqQty = parseFloat(item.requestedQuantity.toString())
                                          const baseQty = parseFloat(item.baseQuantity.toString())
                                          const internalRate = parseFloat(item.product.basePrice.toString())
                                          const lineTotal = getItemLineTotal(item)

                                          return (
                                            <TableRow key={item.id} className="border-slate-850 hover:bg-slate-900/10">
                                              <TableCell>
                                                <div>
                                                  <div className="font-semibold text-white text-xs">{item.product.name}</div>
                                                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.product.sku}</div>
                                                </div>
                                              </TableCell>
                                              <TableCell className="font-mono text-xs text-slate-300">
                                                {reqQty.toLocaleString('en-IN')} {item.requestedUnit}
                                              </TableCell>
                                              <TableCell className="font-mono text-xs text-slate-400">
                                                {baseQty.toLocaleString('en-IN')} {item.product.baseUnit}
                                              </TableCell>
                                              <TableCell className="font-mono text-xs text-slate-450">
                                                ₹{internalRate.toFixed(4)}/{item.product.baseUnit}
                                              </TableCell>
                                              <TableCell>
                                                <div className="relative w-28">
                                                  <span className="absolute inset-y-0 left-2 flex items-center text-slate-500 text-xs font-mono">₹</span>
                                                  <input
                                                    type="number"
                                                    step="0.000001"
                                                    required
                                                    value={quotePrices[item.id] || ''}
                                                    onChange={(e) => handlePriceChange(item.id, e.target.value)}
                                                    className="w-full rounded border border-slate-750 bg-slate-950 py-1 pl-5 pr-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
                                                    placeholder="0.00"
                                                  />
                                                </div>
                                              </TableCell>
                                              <TableCell className="font-mono text-xs font-bold text-white text-right">
                                                ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                              </TableCell>
                                            </TableRow>
                                          )
                                        })}
                                        <TableRow className="border-slate-800 bg-slate-900/10 hover:bg-transparent">
                                          <TableCell colSpan={5} className="font-semibold text-right text-xs text-slate-300">Quoted Total:</TableCell>
                                          <TableCell className="font-mono font-extrabold text-sm text-emerald-400 text-right">
                                            ₹{getLiveGrandTotal(quote).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                          </TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
                                  </div>

                                  <div className="grid gap-4 sm:grid-cols-2 pt-2">
                                    <div>
                                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                        Admin Notes / Terms for Buyer
                                      </label>
                                      <textarea
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        placeholder="Add pricing details, discounts, delivery dates, or terms..."
                                        rows={2}
                                        className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none resize-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                        Update Status Action
                                      </label>
                                      <select
                                        value={quoteStatus}
                                        onChange={(e) => setQuoteStatus(e.target.value as any)}
                                        className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                                      >
                                        <option value="QUOTED">Publish Price to Buyer (QUOTED)</option>
                                        <option value="REVIEWED">Mark In-Progress (REVIEWED)</option>
                                        <option value="REJECTED">Decline Quote Request (REJECTED)</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="flex gap-3 justify-end pt-2 border-t border-slate-850">
                                    <button
                                      type="button"
                                      onClick={() => setActiveQuoteId(null)}
                                      className="rounded-lg border border-slate-800 px-3.5 py-1.5 text-xs text-slate-350 hover:bg-slate-800 hover:text-white"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="submit"
                                      disabled={isSubmitting}
                                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-1.5 px-4 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                                    >
                                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save & Publish'}
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                /* READ-ONLY VIEW OF QUOTATION ITEMS */
                                <div className="rounded-lg border border-slate-850 overflow-hidden">
                                  <Table>
                                    <TableHeader className="bg-slate-900/60">
                                      <TableRow className="border-slate-850 hover:bg-transparent">
                                        <TableHead className="text-xs text-slate-400">Product</TableHead>
                                        <TableHead className="text-xs text-slate-400">Requested Qty</TableHead>
                                        <TableHead className="text-xs text-slate-400">Base Equivalent</TableHead>
                                        <TableHead className="text-xs text-slate-400">Conversion Ratio</TableHead>
                                        <TableHead className="text-xs text-slate-400">Quoted Rate (₹/base)</TableHead>
                                        <TableHead className="text-xs text-slate-400 text-right">Line Total (₹)</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {quote.items.map((item) => {
                                        const reqQty = parseFloat(item.requestedQuantity.toString())
                                        const baseQty = parseFloat(item.baseQuantity.toString())
                                        const quotedPrice = item.quotedUnitPrice ? parseFloat(item.quotedUnitPrice.toString()) : null
                                        const lineTotal = item.lineTotal ? parseFloat(item.lineTotal.toString()) : null

                                        return (
                                          <TableRow key={item.id} className="border-slate-850 hover:bg-slate-900/10">
                                            <TableCell>
                                              <div>
                                                <div className="font-semibold text-white text-xs">{item.product.name}</div>
                                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.product.sku}</div>
                                              </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs font-semibold text-slate-200">
                                              {reqQty.toLocaleString('en-IN')} {item.requestedUnit}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs font-semibold text-slate-400">
                                              {baseQty.toLocaleString('en-IN')} {item.product.baseUnit}
                                            </TableCell>
                                            <TableCell className="text-[10px] text-emerald-450 font-bold font-mono">
                                              {reqQty} {item.requestedUnit} = {baseQty} {item.product.baseUnit}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-slate-350">
                                              {quotedPrice !== null ? (
                                                `₹${quotedPrice.toFixed(4)}/${item.product.baseUnit}`
                                              ) : (
                                                <span className="text-[10px] text-slate-500 italic">Not Quoted</span>
                                              )}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs font-bold text-white text-right">
                                              {lineTotal !== null ? (
                                                `₹${lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                              ) : (
                                                <span className="text-[10px] text-slate-500 italic">—</span>
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        )
                                      })}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}

                              {/* Admin Notes Section */}
                              {!activeQuoteId && quote.adminNotes && (
                                <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-xs">
                                  <span className="font-semibold text-slate-300 block mb-1">Admin Response Notes:</span>
                                  <p className="text-slate-400">&ldquo;{quote.adminNotes}&rdquo;</p>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}

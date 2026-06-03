'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  CheckCircle,
  XCircle,
  Info
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
  }
}

interface Quotation {
  id: string
  status: 'PENDING' | 'REVIEWED' | 'QUOTED' | 'CONFIRMED' | 'REJECTED'
  buyerNotes: string | null
  adminNotes: string | null
  quotedAmount: number | string | null
  createdAt: string
  items: QuotationItem[]
}

export default function BuyerQuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedQuotes, setExpandedQuotes] = useState<Record<string, boolean>>({})
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

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

  const handleAction = async (id: string, action: 'ACCEPT' | 'DECLINE') => {
    const confirmMessage = action === 'ACCEPT' 
      ? 'Do you want to ACCEPT this quote? This will confirm your order and deduct stock.' 
      : 'Do you want to DECLINE this quote?'
      
    if (!confirm(confirmMessage)) return

    try {
      setIsUpdating(id)
      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update quotation action.')
      }

      toast.success(action === 'ACCEPT' ? 'Quote accepted and order confirmed!' : 'Quote declined successfully.')
      fetchQuotations()
    } catch (err: any) {
      toast.error(err.message || 'Error processing quote response.')
    } finally {
      setIsUpdating(null)
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
          <ClipboardList className="h-8 w-8 text-emerald-500" />
          My Quotations
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor quotation statuses, view custom rates published by admins, and accept or decline active quotes.
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : quotations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-855 p-12 text-center bg-slate-900/5">
          <ClipboardList className="mx-auto h-12 w-12 text-slate-655 mb-4" />
          <h3 className="text-lg font-semibold text-white">No Quotation Requests</h3>
          <p className="text-sm text-slate-455 mt-1">You do not have any submitted quote requests.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-850 bg-slate-900/20 overflow-hidden backdrop-blur-sm">
          <Table>
            <TableHeader className="bg-slate-950/40">
              <TableRow className="border-slate-850 hover:bg-transparent">
                <TableHead className="w-10"></TableHead>
                <TableHead className="text-slate-450">Quotation ID</TableHead>
                <TableHead className="text-slate-450">Status</TableHead>
                <TableHead className="text-slate-455">Response Notes</TableHead>
                <TableHead className="text-slate-450">Quoted Amount (₹)</TableHead>
                <TableHead className="text-slate-455">Request Date</TableHead>
                <TableHead className="text-slate-455 text-right">Actions</TableHead>
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
                        <span className={`inline-flex items-center rounded px-2.5 py-0.5 text-xs font-semibold ${statusColors[quote.status]}`}>
                          {quote.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-400 text-xs truncate max-w-[200px]">
                        {quote.adminNotes || <span className="text-slate-655 italic">No response notes yet</span>}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-white">
                        {amount !== null ? (
                          `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                        ) : (
                          <span className="text-xs text-slate-500 italic">Pending Price Review</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-400 text-xs font-medium">
                        {quoteDate}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        {quote.status === 'QUOTED' ? (
                          <div className="flex justify-end gap-2">
                            <button
                              disabled={isUpdating === quote.id}
                              onClick={() => handleAction(quote.id, 'ACCEPT')}
                              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-1.5 px-3 text-xs font-semibold text-white transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              disabled={isUpdating === quote.id}
                              onClick={() => handleAction(quote.id, 'DECLINE')}
                              className="flex items-center gap-1.5 rounded-lg bg-rose-955 hover:bg-rose-900 py-1.5 px-3 text-xs font-semibold text-rose-400 border border-rose-900 transition-colors"
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">—</span>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Expandable Quote items details */}
                    {isExpanded && (
                      <TableRow className="bg-slate-950/20 border-slate-850 hover:bg-slate-950/20">
                        <TableCell colSpan={7} className="p-6">
                          <div className="space-y-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-855 pb-2">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-450 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Quotation Details & Rates
                              </h4>
                              {quote.buyerNotes && (
                                <div className="text-xs text-slate-400 max-w-[400px]">
                                  <span className="font-semibold text-slate-350">My Notes: </span>
                                  &ldquo;{quote.buyerNotes}&rdquo;
                                </div>
                              )}
                            </div>

                            <div className="rounded-lg border border-slate-850 overflow-hidden">
                              <Table>
                                <TableHeader className="bg-slate-900/60">
                                  <TableRow className="border-slate-850 hover:bg-transparent">
                                    <TableHead className="text-xs text-slate-405">Product</TableHead>
                                    <TableHead className="text-xs text-slate-405">Requested Qty</TableHead>
                                    <TableHead className="text-xs text-slate-405">Base Equivalent</TableHead>
                                    <TableHead className="text-xs text-slate-405">Conversion Details</TableHead>
                                    <TableHead className="text-xs text-slate-405">Quoted Rate (₹/base)</TableHead>
                                    <TableHead className="text-xs text-slate-405 text-right">Line Total (₹)</TableHead>
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
                                        <TableCell className="font-mono text-xs font-semibold text-slate-250">
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
                                            `₹${quotedPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}/${item.product.baseUnit}`
                                          ) : (
                                            <span className="text-[10px] text-slate-505 italic">Pending Review</span>
                                          )}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs font-bold text-white text-right">
                                          {lineTotal !== null ? (
                                            `₹${lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                          ) : (
                                            <span className="text-[10px] text-slate-505 italic">—</span>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    )
                                  })}
                                </TableBody>
                              </Table>
                            </div>

                            {/* Response / Notes */}
                            {quote.adminNotes && (
                              <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-4 text-xs">
                                <span className="font-bold text-emerald-450 block mb-1">Administrative Message:</span>
                                <p className="text-slate-300 leading-relaxed">&ldquo;{quote.adminNotes}&rdquo;</p>
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
      )}
    </div>
  )
}

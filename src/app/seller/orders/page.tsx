'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
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
import { TO_BASE_FACTOR } from '@/lib/unit-conversion'

interface OrderItem {
  id: string
  orderedUnit: string
  orderedQuantity: number | string
  baseQuantity: number | string
  unitPriceAtOrder: number | string
  lineTotal: number | string
  product: {
    name: string
    sku: string
    baseUnit: string
  }
}

interface Order {
  id: string
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED'
  totalAmount: number | string
  notes: string | null
  createdAt: string
  items: OrderItem[]
}

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({})

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/orders')
      if (!res.ok) throw new Error('Failed to fetch orders')
      const data = await res.json()
      setOrders(data)
    } catch (err: any) {
      toast.error(err.message || 'Error loading orders.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const toggleExpand = (id: string) => {
    setExpandedOrders((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const statusColors = {
    PENDING: 'bg-yellow-500/10 text-yellow-450 border border-yellow-500/20',
    CONFIRMED: 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20',
    REJECTED: 'bg-rose-500/10 text-rose-450 border border-rose-500/20',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-emerald-500" />
          My Sales Orders
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Track the verification and confirmation status of your submitted sales orders.
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-855 p-12 text-center bg-slate-900/5">
          <ClipboardList className="mx-auto h-12 w-12 text-slate-655 mb-4" />
          <h3 className="text-lg font-semibold text-white">No Orders Placed</h3>
          <p className="text-sm text-slate-450 mt-1">Your placed sales orders will appear here.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-850 bg-slate-900/20 overflow-hidden backdrop-blur-sm">
          <Table>
            <TableHeader className="bg-slate-950/40">
              <TableRow className="border-slate-850 hover:bg-transparent">
                <TableHead className="w-10"></TableHead>
                <TableHead className="text-slate-450">Order ID</TableHead>
                <TableHead className="text-slate-450">Status</TableHead>
                <TableHead className="text-slate-450">Grand Total (₹)</TableHead>
                <TableHead className="text-slate-455">Order Date</TableHead>
                <TableHead className="text-slate-455 text-right">Items Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const isExpanded = !!expandedOrders[order.id]
                const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
                const total = parseFloat(order.totalAmount.toString())

                return (
                  <React.Fragment key={order.id}>
                    <TableRow className="border-slate-850 hover:bg-slate-900/30">
                      <TableCell>
                        <button
                          onClick={() => toggleExpand(order.id)}
                          className="rounded p-1 text-slate-455 hover:bg-slate-850 hover:text-white"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-300">
                        {order.id.slice(0, 8).toUpperCase()}...
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded px-2.5 py-0.5 text-xs font-semibold ${statusColors[order.status]}`}>
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono font-bold text-white">
                        ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-slate-400 text-xs font-medium">
                        {orderDate}
                      </TableCell>
                      <TableCell className="text-right text-slate-300 font-semibold pr-6">
                        {order.items.length}
                      </TableCell>
                    </TableRow>

                    {/* Expandable Details Breakdown */}
                    {isExpanded && (
                      <TableRow className="bg-slate-950/20 border-slate-850 hover:bg-slate-950/20">
                        <TableCell colSpan={6} className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-450 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Order Details Breakdown
                              </h4>
                              {order.notes && (
                                <div className="text-xs text-slate-400 max-w-[400px]">
                                  <span className="font-semibold text-slate-350">My Notes: </span>
                                  &ldquo;{order.notes}&rdquo;
                                </div>
                              )}
                            </div>

                            <div className="rounded-lg border border-slate-850 overflow-hidden">
                              <Table>
                                <TableHeader className="bg-slate-900/60">
                                  <TableRow className="border-slate-850 hover:bg-transparent">
                                    <TableHead className="text-xs text-slate-400">Product</TableHead>
                                    <TableHead className="text-xs text-slate-400">Ordered Qty</TableHead>
                                    <TableHead className="text-xs text-slate-400">Base Equivalent</TableHead>
                                    <TableHead className="text-xs text-slate-400">Conversion Ratio</TableHead>
                                    <TableHead className="text-xs text-slate-400">Unit Price (₹/base)</TableHead>
                                    <TableHead className="text-xs text-slate-400">Effective Rate (₹/ordered)</TableHead>
                                    <TableHead className="text-xs text-slate-400 text-right">Line Total (₹)</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {order.items.map((item) => {
                                    const ordQty = parseFloat(item.orderedQuantity.toString())
                                    const baseQty = parseFloat(item.baseQuantity.toString())
                                    const basePrice = parseFloat(item.unitPriceAtOrder.toString())
                                    const lineTotal = parseFloat(item.lineTotal.toString())
                                    
                                    const factor = TO_BASE_FACTOR[item.orderedUnit] || 1
                                    const effectiveRate = basePrice * factor

                                    return (
                                      <TableRow key={item.id} className="border-slate-850 hover:bg-slate-900/10">
                                        <TableCell>
                                          <div>
                                            <div className="font-semibold text-white text-xs">{item.product.name}</div>
                                            <div className="text-[10px] text-slate-505 font-mono mt-0.5">{item.product.sku}</div>
                                          </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs font-semibold text-slate-200">
                                          {ordQty.toLocaleString('en-IN')} {item.orderedUnit}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs font-semibold text-slate-400">
                                          {baseQty.toLocaleString('en-IN')} {item.product.baseUnit}
                                        </TableCell>
                                        <TableCell className="text-[10px] text-emerald-450 font-bold font-mono">
                                          {ordQty} {item.orderedUnit} = {baseQty} {item.product.baseUnit}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-slate-350">
                                          ₹{basePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}/{item.product.baseUnit}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-slate-350">
                                          ₹{effectiveRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}/{item.orderedUnit}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs font-bold text-white text-right">
                                          ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                      </TableRow>
                                    )
                                  })}
                                </TableBody>
                              </Table>
                            </div>
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

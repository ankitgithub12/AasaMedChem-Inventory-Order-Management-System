'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Package,
  Plus,
  Edit,
  Trash,
  AlertTriangle,
  Check,
  X,
  Loader2,
  Info,
  DollarSign
} from 'lucide-react'
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

interface Product {
  id: string
  name: string
  sku: string
  description: string | null
  category: string | null
  baseUnit: 'GRAM' | 'KILOGRAM' | 'LITER' | 'MILLILITER' | 'UNIT'
  basePrice: number | string
  stockQuantity: number | string
  isActive: boolean
  isPricePublic: boolean
}

export default function AdminProductsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const filterParam = searchParams.get('filter')
  const newParam = searchParams.get('new')

  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Edit target
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form Fields
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [baseUnit, setBaseUnit] = useState<'GRAM' | 'KILOGRAM' | 'LITER' | 'MILLILITER' | 'UNIT'>('GRAM')
  const [basePrice, setBasePrice] = useState('')
  const [stockQuantity, setStockQuantity] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isPricePublic, setIsPricePublic] = useState(false)

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Failed to fetch products')
      const data = await res.json()
      setProducts(data)
    } catch (err: any) {
      toast.error(err.message || 'Error loading products.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Auto-trigger add dialog if query param is set
  useEffect(() => {
    if (newParam === 'true') {
      openAddDialog()
      // Clean query parameter
      router.replace('/admin/products')
    }
  }, [newParam, router])

  const openAddDialog = () => {
    setEditingId(null)
    setName('')
    setSku('')
    setDescription('')
    setCategory('')
    setBaseUnit('GRAM')
    setBasePrice('')
    setStockQuantity('')
    setIsActive(true)
    setIsPricePublic(false)
    setIsDialogOpen(true)
  }

  const openEditDialog = (product: Product) => {
    setEditingId(product.id)
    setName(product.name)
    setSku(product.sku)
    setDescription(product.description || '')
    setCategory(product.category || '')
    setBaseUnit(product.baseUnit)
    setBasePrice(product.basePrice.toString())
    setStockQuantity(product.stockQuantity.toString())
    setIsActive(product.isActive)
    setIsPricePublic(product.isPricePublic)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    if (!name || !sku || !baseUnit || !basePrice || !stockQuantity) {
      toast.error('Please fill in all required fields.')
      setIsSaving(false)
      return
    }

    const priceNum = parseFloat(basePrice)
    const stockNum = parseFloat(stockQuantity)

    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('Base price must be a positive number.')
      setIsSaving(false)
      return
    }

    if (isNaN(stockNum) || stockNum < 0) {
      toast.error('Stock quantity must be a positive number.')
      setIsSaving(false)
      return
    }

    const payload = {
      name,
      sku,
      description: description || null,
      category: category || null,
      baseUnit,
      basePrice: priceNum,
      stockQuantity: stockNum,
      isActive,
      isPricePublic,
    }

    try {
      const url = editingId ? `/api/products/${editingId}` : '/api/products'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save product.')

      toast.success(editingId ? `Product "${name}" updated!` : `Product "${name}" created!`)
      setIsDialogOpen(false)
      fetchProducts()
    } catch (err: any) {
      toast.error(err.message || 'Error saving product.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete product.')

      toast.success(`Product "${name}" deleted.`)
      fetchProducts()
    } catch (err: any) {
      toast.error(err.message || 'Could not delete product.')
    }
  }

  const handleToggleActive = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !product.isActive }),
      })
      if (!res.ok) throw new Error('Failed to toggle status.')
      toast.success(`Product "${product.name}" is now ${!product.isActive ? 'Active' : 'Inactive'}`)
      fetchProducts()
    } catch (err: any) {
      toast.error(err.message || 'Error updating product status.')
    }
  }

  const handleTogglePublic = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPricePublic: !product.isPricePublic }),
      })
      if (!res.ok) throw new Error('Failed to toggle price visibility.')
      toast.success(`Price of "${product.name}" is now ${!product.isPricePublic ? 'Public' : 'Hidden (On Request)'}`)
      fetchProducts()
    } catch (err: any) {
      toast.error(err.message || 'Error updating price visibility.')
    }
  }

  // Get Conversion Helper Preview text
  const getConversionPreview = () => {
    const priceVal = parseFloat(basePrice)
    if (isNaN(priceVal) || priceVal <= 0) return ''

    if (baseUnit === 'GRAM') {
      const perKg = (priceVal * 1000).toFixed(2)
      const perMg = (priceVal / 1000).toFixed(6)
      return `Equivalent: ₹${perKg}/KILOGRAM, ₹${perMg}/mg`
    }
    if (baseUnit === 'KILOGRAM') {
      const perG = (priceVal / 1000).toFixed(6)
      return `Equivalent: ₹${perG}/GRAM`
    }
    if (baseUnit === 'MILLILITER') {
      const perL = (priceVal * 1000).toFixed(2)
      return `Equivalent: ₹${perL}/LITER`
    }
    if (baseUnit === 'LITER') {
      const perMl = (priceVal / 1000).toFixed(6)
      return `Equivalent: ₹${perMl}/MILLILITER`
    }
    return 'No additional conversions needed (stored per UNIT).'
  }

  const filteredProducts = products.filter((p) => {
    if (filterParam === 'low-stock') {
      return parseFloat(p.stockQuantity.toString()) < 100
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Package className="h-8 w-8 text-emerald-500" />
            Product Catalog
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {filterParam === 'low-stock' ? 'Displaying low stock alert items only.' : 'Manage chemical inventory, base units, and price configurations.'}
          </p>
        </div>
        <div className="flex gap-2.5">
          {filterParam === 'low-stock' && (
            <button
              onClick={() => router.push('/admin/products')}
              className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:text-white"
            >
              Clear Filter
            </button>
          )}
          <button
            onClick={openAddDialog}
            className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2.5 px-4 text-sm font-semibold text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-850 p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-white">No Products Found</h3>
          <p className="text-sm text-slate-450 mt-1">Add a new chemical/equipment to inventory to begin.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-850 bg-slate-900/20 overflow-hidden backdrop-blur-sm">
          <Table>
            <TableHeader className="bg-slate-950/40">
              <TableRow className="border-slate-850 hover:bg-transparent">
                <TableHead className="text-slate-450">Name / SKU</TableHead>
                <TableHead className="text-slate-450">Category</TableHead>
                <TableHead className="text-slate-450">Base Unit</TableHead>
                <TableHead className="text-slate-450">Base Price (₹)</TableHead>
                <TableHead className="text-slate-450">Stock Quantity</TableHead>
                <TableHead className="text-slate-450 text-center">Price Public</TableHead>
                <TableHead className="text-slate-450 text-center">Active</TableHead>
                <TableHead className="text-slate-455 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const stock = parseFloat(product.stockQuantity.toString())
                const price = parseFloat(product.basePrice.toString())
                const isLowStock = stock < 100

                return (
                  <TableRow key={product.id} className="border-slate-850 hover:bg-slate-900/30">
                    <TableCell>
                      <div>
                        <div className="font-semibold text-white">{product.name}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{product.sku}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300 font-medium">
                      {product.category || <span className="text-slate-650">—</span>}
                    </TableCell>
                    <TableCell>
                      <span className="rounded bg-slate-950 px-2 py-1 text-xs text-emerald-450 font-mono font-bold">
                        {product.baseUnit}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-200 font-semibold font-mono">
                      ₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-semibold ${isLowStock ? 'text-amber-500' : 'text-slate-200'}`}>
                          {stock.toLocaleString('en-IN', { maximumFractionDigits: 2 })} {product.baseUnit}
                        </span>
                        {isLowStock && (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/10 text-amber-550 border border-amber-500/20" title="Low stock warning (under 100)">
                            <AlertTriangle className="h-3 w-3 animate-bounce" />
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => handleTogglePublic(product)}
                        className={`inline-flex rounded px-2.5 py-1 text-xs font-bold transition-all ${
                          product.isPricePublic
                            ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
                            : 'bg-slate-900 text-slate-500 border border-slate-800'
                        }`}
                      >
                        {product.isPricePublic ? 'Public' : 'Private (Quote)'}
                      </button>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => handleToggleActive(product)}
                        className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-bold transition-all ${
                          product.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                            : 'bg-rose-500/10 text-rose-450 border border-rose-500/20'
                        }`}
                      >
                        {product.isActive ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> Active
                          </>
                        ) : (
                          <>
                            <X className="h-3.5 w-3.5" /> Inactive
                          </>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditDialog(product)}
                          className="rounded p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                          title="Edit Product"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="rounded p-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                          title="Delete Product"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border border-slate-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Configure chemical details, storage units, and stock quantities.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sodium Chloride"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  SKU Code * (Unique)
                </label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="CHEM-NaCl-001"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Category (optional)
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Chemicals / Reagents"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the purity grade, hazard warnings, or applications..."
                  rows={2}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-sm text-white focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Base Storage Unit *
                </label>
                <select
                  value={baseUnit}
                  onChange={(e) => setBaseUnit(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="GRAM">GRAM (Weight)</option>
                  <option value="KILOGRAM">KILOGRAM (Weight)</option>
                  <option value="MILLILITER">MILLILITER (Volume)</option>
                  <option value="LITER">LITER (Volume)</option>
                  <option value="UNIT">UNIT (Count)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Base Price (₹ per base unit) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-600 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="0.05"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-7 pr-3 text-sm text-white focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Conversion Preview Help box */}
              {basePrice && (
                <div className="sm:col-span-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 flex gap-2.5 items-start">
                  <Info className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-emerald-450 font-semibold">
                      Base price is ₹{parseFloat(basePrice).toFixed(6)} per {baseUnit}
                    </p>
                    <p className="text-[11px] text-slate-450 mt-1 font-mono">
                      {getConversionPreview()}
                    </p>
                  </div>
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Initial Stock Quantity (in base unit) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="50000"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 px-3.5 text-sm text-white focus:border-emerald-500 focus:outline-none font-mono"
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 text-xs font-mono font-bold">
                    {baseUnit}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isActive" className="text-sm text-slate-300 cursor-pointer font-medium select-none">
                  Available for Sale (Active)
                </label>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="isPricePublic"
                  checked={isPricePublic}
                  onChange={(e) => setIsPricePublic(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isPricePublic" className="text-sm text-slate-300 cursor-pointer font-medium select-none">
                  Public Pricing (Visible to Buyers)
                </label>
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
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useCart } from '@/lib/cart-context'
import { getCompatibleUnits } from '@/lib/unit-conversion'
import {
  Package,
  Search,
  FileText,
  Check,
  Loader2,
  Lock
} from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string
  description: string | null
  category: string | null
  baseUnit: string
  basePrice: number | null // Will be null if isPricePublic = false
  isPricePublic: boolean
}

export default function BuyerProductsPage() {
  const { buyerCart, addToBuyerCart } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      const query = new URLSearchParams()
      if (search) query.append('search', search)
      if (category) query.append('category', category)
      // Buyers only see active
      query.append('is_active', 'true')

      const res = await fetch(`/api/products?${query.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch products')
      const data = await res.json()
      setProducts(data)

      if (categories.length === 0) {
        const uniqueCats = Array.from(
          new Set(data.map((p: Product) => p.category).filter(Boolean))
        ) as string[]
        setCategories(uniqueCats)
      }
    } catch (err: any) {
      toast.error(err.message || 'Error loading catalog.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [category])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchProducts()
  }

  const handleAddToQuote = (product: Product) => {
    addToBuyerCart(
      {
        id: product.id,
        name: product.name,
        sku: product.sku,
        baseUnit: product.baseUnit,
        basePrice: product.basePrice, // Might be null
        isPricePublic: product.isPricePublic,
        category: product.category,
      },
      1,
      product.baseUnit
    )
    toast.success(`Added "${product.name}" to quote request!`)
  }

  const isInQuoteCart = (productId: string) => {
    return buyerCart.some((item) => item.productId === productId)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Package className="h-8 w-8 text-emerald-500" />
            Product Catalog
          </h1>
          <p className="text-sm text-slate-450 mt-1">
            Browse active products, view base pricing (where public), and request quotations.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="grid gap-4 sm:grid-cols-3 bg-slate-900/20 p-4 rounded-xl border border-slate-850 backdrop-blur-sm">
        <div className="relative sm:col-span-2">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by chemical name or SKU..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950/60 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="flex-1 rounded-lg border border-slate-800 bg-slate-950/60 py-2 px-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-slate-850 hover:bg-slate-800 text-sm font-semibold text-white px-4 border border-slate-800 transition-colors"
          >
            Go
          </button>
        </div>
      </form>

      {/* Products Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-855 p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-slate-655 mb-4" />
          <h3 className="text-lg font-semibold text-white">No Products Found</h3>
          <p className="text-sm text-slate-455 mt-1">No products match your query parameters.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const isAdded = isInQuoteCart(product.id)
            const compatibleUnits = getCompatibleUnits(product.baseUnit)
            const hasPrice = product.isPricePublic && product.basePrice !== null
            const basePrice = hasPrice ? parseFloat(product.basePrice!.toString()) : null

            return (
              <div
                key={product.id}
                className="flex flex-col justify-between rounded-xl border border-slate-855 bg-slate-900/20 p-5 shadow-sm backdrop-blur-sm hover:border-slate-800 transition-all"
              >
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-450 px-2 py-0.5 rounded bg-emerald-500/10">
                    {product.category || 'General'}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-2 truncate">{product.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{product.sku}</p>

                  <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                    {product.description || 'No description provided.'}
                  </p>

                  <div className="mt-4 space-y-2 border-t border-slate-850/60 pt-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-455">Indicative Price:</span>
                      {hasPrice && basePrice !== null ? (
                        <span className="font-semibold text-white font-mono">
                          ₹{basePrice.toFixed(2)} / {product.baseUnit}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-amber-500 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                          <Lock className="h-3 w-3" />
                          Price on Request
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-500 pt-1">
                      <span className="font-semibold text-slate-450">Available Units: </span>
                      <span className="font-mono">{compatibleUnits.join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-850/60">
                  <button
                    onClick={() => handleAddToQuote(product)}
                    className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 px-4 text-xs font-bold text-white transition-all ${
                      isAdded
                        ? 'bg-emerald-600/20 text-emerald-450 border border-emerald-500/30'
                        : 'bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.01]'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="h-4.5 w-4.5 text-emerald-400" />
                        Added to Quote Request
                      </>
                    ) : (
                      <>
                        <FileText className="h-4.5 w-4.5" />
                        Add to Quote Request
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

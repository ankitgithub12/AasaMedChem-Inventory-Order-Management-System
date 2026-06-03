'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useCart } from '@/lib/cart-context'
import { getCompatibleUnits } from '@/lib/unit-conversion'
import {
  Package,
  Search,
  Filter,
  ShoppingCart,
  Check,
  Loader2,
  AlertTriangle
} from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string
  description: string | null
  category: string | null
  baseUnit: string
  basePrice: number | string
  stockQuantity: number | string
  isActive: boolean
  isPricePublic: boolean
}

export default function SellerProductsPage() {
  const { sellerCart, addToSellerCart } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Search & Filter state
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [dimension, setDimension] = useState('')

  // Unique categories list for dropdown
  const [categories, setCategories] = useState<string[]>([])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      
      const query = new URLSearchParams()
      if (search) query.append('search', search)
      if (category) query.append('category', category)
      if (dimension) query.append('unit_dimension', dimension)
      // Only active products
      query.append('is_active', 'true')

      const res = await fetch(`/api/products?${query.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch products')
      const data = await res.json()
      setProducts(data)

      // Fetch categories list once if not set
      if (categories.length === 0) {
        const uniqueCats = Array.from(
          new Set(data.map((p: Product) => p.category).filter(Boolean))
        ) as string[]
        setCategories(uniqueCats)
      }
    } catch (err: any) {
      toast.error(err.message || 'Error loading products.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [category, dimension]) // Refetch on dropdown change

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchProducts()
  }

  const handleAddToCart = (product: Product) => {
    const stock = parseFloat(product.stockQuantity.toString())
    if (stock <= 0) {
      toast.error('Product is out of stock.')
      return
    }

    addToSellerCart(
      {
        id: product.id,
        name: product.name,
        sku: product.sku,
        baseUnit: product.baseUnit,
        basePrice: parseFloat(product.basePrice.toString()),
        isPricePublic: product.isPricePublic,
        category: product.category,
      },
      1, // default quantity
      product.baseUnit // default unit
    )
    toast.success(`Added "${product.name}" to cart!`)
  }

  const isInCart = (productId: string) => {
    return sellerCart.some((item) => item.productId === productId)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Package className="h-8 w-8 text-emerald-500" />
            Browse Products
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse our inventory catalog, check compatible storage units, and assemble orders.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 bg-slate-900/20 p-4 rounded-xl border border-slate-850 backdrop-blur-sm">
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950/60 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950/60 py-2 px-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={dimension}
            onChange={(e) => setDimension(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950/60 py-2 px-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
          >
            <option value="">All Dimensions</option>
            <option value="weight">Weight (g, kg)</option>
            <option value="volume">Volume (mL, L)</option>
            <option value="count">Count (unit)</option>
          </select>
        </div>

        <div>
          <button
            type="submit"
            className="w-full rounded-lg bg-slate-850 hover:bg-slate-800 text-sm font-semibold text-white py-2 border border-slate-800 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </form>

      {/* Product List Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-850 p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-slate-655 mb-4" />
          <h3 className="text-lg font-semibold text-white">No Products Found</h3>
          <p className="text-sm text-slate-450 mt-1">Try resetting your search filters.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const stock = parseFloat(product.stockQuantity.toString())
            const price = parseFloat(product.basePrice.toString())
            const isLowStock = stock < 100
            const isAdded = isInCart(product.id)
            const compatibleUnits = getCompatibleUnits(product.baseUnit)

            return (
              <div
                key={product.id}
                className="flex flex-col justify-between rounded-xl border border-slate-855 bg-slate-900/20 p-5 shadow-sm backdrop-blur-sm hover:border-slate-800 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-450 px-2 py-0.5 rounded bg-emerald-500/10">
                        {product.category || 'General'}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-2 truncate">{product.name}</h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{product.sku}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                    {product.description || 'No description provided.'}
                  </p>

                  <div className="mt-4 space-y-2 border-t border-slate-850/60 pt-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-455">Base Rate:</span>
                      <span className="font-semibold text-white font-mono">
                        ₹{price.toFixed(4)} / {product.baseUnit}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-slate-455">Available Stock:</span>
                      <span className={`font-semibold font-mono ${isLowStock ? 'text-amber-500 font-bold' : 'text-slate-300'}`}>
                        {stock.toLocaleString('en-IN')} {product.baseUnit}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 mt-2">
                      <span className="font-semibold text-slate-450">Compatible Units: </span>
                      <span className="font-mono">{compatibleUnits.join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-850/60">
                  <button
                    disabled={stock <= 0}
                    onClick={() => handleAddToCart(product)}
                    className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 px-4 text-xs font-bold text-white transition-all ${
                      stock <= 0
                        ? 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
                        : isAdded
                        ? 'bg-emerald-600/20 text-emerald-450 border border-emerald-500/30'
                        : 'bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.01]'
                    }`}
                  >
                    {stock <= 0 ? (
                      <>
                        <AlertTriangle className="h-4.5 w-4.5 text-rose-500" />
                        Out of Stock
                      </>
                    ) : isAdded ? (
                      <>
                        <Check className="h-4.5 w-4.5 text-emerald-400" />
                        Added to Cart
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4.5 w-4.5" />
                        Add to Cart
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

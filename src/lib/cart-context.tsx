'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface CartItem {
  productId: string
  name: string
  sku: string
  baseUnit: string
  basePrice: number | null
  isPricePublic: boolean
  category?: string | null
  quantity: number
  unit: string
}

interface CartContextType {
  sellerCart: CartItem[]
  addToSellerCart: (product: any, quantity: number, unit: string) => void
  removeFromSellerCart: (productId: string) => void
  updateSellerCartItem: (productId: string, quantity: number, unit: string) => void
  clearSellerCart: () => void

  buyerCart: CartItem[]
  addToBuyerCart: (product: any, quantity: number, unit: string) => void
  removeFromBuyerCart: (productId: string) => void
  updateBuyerCartItem: (productId: string, quantity: number, unit: string) => void
  clearBuyerCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [sellerCart, setSellerCart] = useState<CartItem[]>([])
  const [buyerCart, setBuyerCart] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on client mount
  useEffect(() => {
    const sCart = localStorage.getItem('aasa_seller_cart')
    const bCart = localStorage.getItem('aasa_buyer_cart')
    if (sCart) {
      try {
        setSellerCart(JSON.parse(sCart))
      } catch (e) {
        console.error(e)
      }
    }
    if (bCart) {
      try {
        setBuyerCart(JSON.parse(bCart))
      } catch (e) {
        console.error(e)
      }
    }
    setIsLoaded(true)
  }, [])

  // Persist to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('aasa_seller_cart', JSON.stringify(sellerCart))
    }
  }, [sellerCart, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('aasa_buyer_cart', JSON.stringify(buyerCart))
    }
  }, [buyerCart, isLoaded])

  const addToSellerCart = (product: any, quantity: number, unit: string) => {
    setSellerCart((prev) => {
      const exists = prev.find((item) => item.productId === product.id)
      if (exists) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          baseUnit: product.baseUnit,
          basePrice: product.basePrice,
          isPricePublic: product.isPricePublic,
          category: product.category,
          quantity,
          unit,
        },
      ]
    })
  }

  const removeFromSellerCart = (productId: string) => {
    setSellerCart((prev) => prev.filter((item) => item.productId !== productId))
  }

  const updateSellerCartItem = (productId: string, quantity: number, unit: string) => {
    setSellerCart((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, quantity, unit } : item))
    )
  }

  const clearSellerCart = () => {
    setSellerCart([])
  }

  const addToBuyerCart = (product: any, quantity: number, unit: string) => {
    setBuyerCart((prev) => {
      const exists = prev.find((item) => item.productId === product.id)
      if (exists) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          baseUnit: product.baseUnit,
          basePrice: product.basePrice,
          isPricePublic: product.isPricePublic,
          category: product.category,
          quantity,
          unit,
        },
      ]
    })
  }

  const removeFromBuyerCart = (productId: string) => {
    setBuyerCart((prev) => prev.filter((item) => item.productId !== productId))
  }

  const updateBuyerCartItem = (productId: string, quantity: number, unit: string) => {
    setBuyerCart((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, quantity, unit } : item))
    )
  }

  const clearBuyerCart = () => {
    setBuyerCart([])
  }

  return (
    <CartContext.Provider
      value={{
        sellerCart,
        addToSellerCart,
        removeFromSellerCart,
        updateSellerCartItem,
        clearSellerCart,
        buyerCart,
        addToBuyerCart,
        removeFromBuyerCart,
        updateBuyerCartItem,
        clearBuyerCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

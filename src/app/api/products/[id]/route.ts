import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Unit } from "@prisma/client"

export const dynamic = "force-dynamic"

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = params
    const body = await req.json()
    const {
      name,
      sku,
      description,
      category,
      baseUnit,
      basePrice,
      stockQuantity,
      isActive,
      isPricePublic,
    } = body

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 444 }) // or 404
    }

    // Check SKU uniqueness if changed
    if (sku && sku !== existingProduct.sku) {
      const skuConflict = await prisma.product.findUnique({
        where: { sku },
      })
      if (skuConflict) {
        return NextResponse.json({ error: "SKU already exists" }, { status: 400 })
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: name ?? undefined,
        sku: sku ?? undefined,
        description: description !== undefined ? description : undefined,
        category: category !== undefined ? category : undefined,
        baseUnit: baseUnit ? (baseUnit as Unit) : undefined,
        basePrice: basePrice !== undefined ? parseFloat(basePrice) : undefined,
        stockQuantity: stockQuantity !== undefined ? parseFloat(stockQuantity) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        isPricePublic: isPricePublic !== undefined ? isPricePublic : undefined,
      },
    })

    return NextResponse.json(updatedProduct)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error"
    console.error(`PUT /api/products/${params.id} error:`, error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = params

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Check if product is referenced in order items or quotation items
    const ordersWithProduct = await prisma.orderItem.findFirst({
      where: { productId: id },
    })
    const quotationsWithProduct = await prisma.quotationItem.findFirst({
      where: { productId: id },
    })

    if (ordersWithProduct || quotationsWithProduct) {
      // Soft delete instead or prevent? Let's just prevent deletion and ask them to mark it inactive
      return NextResponse.json(
        { error: "Product is linked to existing orders/quotations. Mark it inactive instead." },
        { status: 400 }
      )
    }

    await prisma.product.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error"
    console.error(`DELETE /api/products/${params.id} error:`, error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

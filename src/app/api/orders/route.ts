import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { isUnitCompatible, toBaseUnit } from "@/lib/unit-conversion"
import { Unit, OrderStatus } from "@prisma/client"
import { notifyAdmins } from "@/lib/notifications"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { role, id: userId } = session.user

    if (role === "BUYER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let orders;
    if (role === "ADMIN") {
      orders = await prisma.order.findMany({
        include: {
          seller: { select: { name: true, email: true } },
          items: {
            include: {
              product: { select: { name: true, sku: true, baseUnit: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    } else {
      // SELLER
      orders = await prisma.order.findMany({
        where: { sellerId: userId },
        include: {
          items: {
            include: {
              product: { select: { name: true, sku: true, baseUnit: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    }

    return NextResponse.json(orders)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error"
    console.error("GET /api/orders error:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "SELLER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { items, notes } = body as {
      items: Array<{ productId: string; orderedQty: number; orderedUnit: string }>
      notes?: string
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Order must contain at least one item" }, { status: 400 })
    }

    // Server-side validation and conversion
    const itemsDataToCreate: any[] = []
    let computedTotalAmount = 0

    // We fetch products to check compatibility and get snapshots of price
    const productIds = items.map((item) => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    })

    const productMap = new Map(products.map((p) => [p.id, p]))

    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) {
        return NextResponse.json({ error: `Product with ID ${item.productId} not found` }, { status: 400 })
      }

      if (!product.isActive) {
        return NextResponse.json({ error: `Product ${product.name} is inactive` }, { status: 400 })
      }

      // 1. Validate compatibility
      if (!isUnitCompatible(product.baseUnit, item.orderedUnit)) {
        return NextResponse.json(
          {
            error: `Unit mismatch: ${item.orderedUnit} is not compatible with product ${product.name}'s base unit ${product.baseUnit}`,
          },
          { status: 400 }
        )
      }

      // 2. base_quantity = toBaseUnit(orderedQty, orderedUnit)
      const baseQuantity = toBaseUnit(item.orderedQty, item.orderedUnit)

      // Check stock sufficiency
      const stock = product.stockQuantity.toNumber()
      if (stock < baseQuantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${product.name}. Available: ${stock} ${product.baseUnit}. Requested: ${baseQuantity} ${product.baseUnit}`,
          },
          { status: 400 }
        )
      }

      // 3. unit_price_at_order = product.base_price (snapshot)
      const unitPriceAtOrder = product.basePrice.toNumber()

      // 4. line_total = base_quantity * unit_price_at_order
      const lineTotal = parseFloat((baseQuantity * unitPriceAtOrder).toFixed(6))
      computedTotalAmount += lineTotal

      itemsDataToCreate.push({
        productId: item.productId,
        orderedUnit: item.orderedUnit as Unit,
        orderedQuantity: item.orderedQty,
        baseQuantity,
        unitPriceAtOrder,
        lineTotal,
      })
    }

    // 5. Save order + items & update inventory inside a transaction
    const resultOrder = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          sellerId: session.user.id,
          status: OrderStatus.PENDING,
          totalAmount: computedTotalAmount,
          notes,
          items: {
            create: itemsDataToCreate.map((item) => ({
              productId: item.productId,
              orderedUnit: item.orderedUnit,
              orderedQuantity: item.orderedQuantity,
              baseQuantity: item.baseQuantity,
              unitPriceAtOrder: item.unitPriceAtOrder,
              lineTotal: item.lineTotal,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: { select: { name: true, sku: true, baseUnit: true } },
            },
          },
        },
      })

      // Update product inventory (deduct stock)
      for (const item of itemsDataToCreate) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.baseQuantity,
            },
          },
        })
      }

      return newOrder
    })

    // Notify admins of the new order
    await notifyAdmins(
      "New Order Placed",
      `Seller ${session.user.name || "Representative"} has placed order #${resultOrder.id.slice(0, 8)} of ₹${resultOrder.totalAmount.toString()}`,
      "ORDER_CREATED",
      "/admin/orders"
    )

    return NextResponse.json(resultOrder, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error"
    console.error("POST /api/orders error:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

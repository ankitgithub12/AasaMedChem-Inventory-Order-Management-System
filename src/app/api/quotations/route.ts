import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { isUnitCompatible, toBaseUnit } from "@/lib/unit-conversion"
import { Unit, QuotationStatus } from "@prisma/client"
import { notifyAdmins } from "@/lib/notifications"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { role, id: userId } = session.user

    let quotations;
    if (role === "ADMIN") {
      quotations = await prisma.quotation.findMany({
        include: {
          buyer: { select: { name: true, email: true, companyName: true, phone: true } },
          items: {
            include: {
              product: { select: { name: true, sku: true, baseUnit: true, basePrice: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    } else if (role === "BUYER") {
      quotations = await prisma.quotation.findMany({
        where: { buyerId: userId },
        include: {
          items: {
            include: {
              product: { select: { name: true, sku: true, baseUnit: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(quotations)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error"
    console.error("GET /api/quotations error:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "BUYER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { items, buyerNotes } = body as {
      items: Array<{ productId: string; requestedQty: number; requestedUnit: string }>
      buyerNotes?: string
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Quotation must contain at least one item" }, { status: 400 })
    }

    // Validation and base unit conversion
    const itemsDataToCreate: any[] = []
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

      // Validate compatibility
      if (!isUnitCompatible(product.baseUnit, item.requestedUnit)) {
        return NextResponse.json(
          {
            error: `Unit mismatch: ${item.requestedUnit} is not compatible with product ${product.name}'s base unit ${product.baseUnit}`,
          },
          { status: 400 }
        )
      }

      const baseQuantity = toBaseUnit(item.requestedQty, item.requestedUnit)

      itemsDataToCreate.push({
        productId: item.productId,
        requestedUnit: item.requestedUnit as Unit,
        requestedQuantity: item.requestedQty,
        baseQuantity,
      })
    }

    // Save with status PENDING (pricing left empty/null)
    const newQuotation = await prisma.quotation.create({
      data: {
        buyerId: session.user.id,
        status: QuotationStatus.PENDING,
        buyerNotes,
        items: {
          create: itemsDataToCreate.map((item) => ({
            productId: item.productId,
            requestedUnit: item.requestedUnit,
            requestedQuantity: item.requestedQuantity,
            baseQuantity: item.baseQuantity,
          })),
        },
      },
      include: {
        items: true,
      },
    })

    // Notify admins of the new quote request
    await notifyAdmins(
      "New Quote Request",
      `Buyer ${session.user.name || "Customer"} (${session.user.companyName || "No Company"}) has requested a quote #${newQuotation.id.slice(0, 8)}`,
      "QUOTE_CREATED",
      "/admin/quotations"
    )

    return NextResponse.json(newQuotation, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error"
    console.error("POST /api/quotations error:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

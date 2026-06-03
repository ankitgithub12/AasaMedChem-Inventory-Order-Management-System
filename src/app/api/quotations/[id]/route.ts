import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { QuotationStatus } from "@prisma/client"
import { notifyUser, notifyAdmins } from "@/lib/notifications"

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const { role } = session.user
    const body = await req.json()

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
      },
    })

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
    }

    if (role === "ADMIN") {
      const { items, adminNotes, status } = body as {
        items: Array<{ itemId: string; quotedUnitPrice: number }>
        adminNotes?: string
        status: QuotationStatus
      }

      if (!status || !["REVIEWED", "QUOTED", "REJECTED"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 })
      }

      if (status === "REJECTED" || status === "REVIEWED") {
        const updated = await prisma.quotation.update({
          where: { id },
          data: { status, adminNotes },
        })

        // Notify the buyer
        await notifyUser(
          updated.buyerId,
          `Quotation ${status === "REJECTED" ? "Rejected" : "Reviewed"}`,
          `Your quotation request #${updated.id.slice(0, 8)} has been ${status === "REJECTED" ? "rejected" : "reviewed"} by the Admin`,
          "QUOTE_STATUS_UPDATED",
          "/buyer/quotations"
        )

        return NextResponse.json(updated)
      }

      // If status is QUOTED, we require items pricing
      if (!items || items.length === 0) {
        return NextResponse.json({ error: "Pricing items are required to mark as QUOTED" }, { status: 400 })
      }

      let computedQuotedAmount = 0
      const itemsToUpdate: Array<{ id: string; quotedUnitPrice: number; lineTotal: number }> = []

      for (const item of items) {
        const quoteItem = quotation.items.find((qi) => qi.id === item.itemId)
        if (!quoteItem) {
          return NextResponse.json({ error: `Quotation item ${item.itemId} not found` }, { status: 400 })
        }

        const price = parseFloat(item.quotedUnitPrice.toString())
        const baseQty = quoteItem.baseQuantity.toNumber()
        const lineTotal = parseFloat((baseQty * price).toFixed(6))

        computedQuotedAmount += lineTotal
        itemsToUpdate.push({
          id: item.itemId,
          quotedUnitPrice: price,
          lineTotal,
        })
      }

      const updatedQuotation = await prisma.$transaction(async (tx) => {
        // Update all items
        for (const item of itemsToUpdate) {
          await tx.quotationItem.update({
            where: { id: item.id },
            data: {
              quotedUnitPrice: item.quotedUnitPrice,
              lineTotal: item.lineTotal,
            },
          })
        }

        // Update the quotation status and grand total
        return await tx.quotation.update({
          where: { id },
          data: {
            status,
            adminNotes,
            quotedAmount: computedQuotedAmount,
          },
          include: {
            items: {
              include: { product: true },
            },
          },
        })
      })

      // Notify the buyer
      await notifyUser(
        updatedQuotation.buyerId,
        "Quotation Price Quoted",
        `Admin has quoted ₹${updatedQuotation.quotedAmount?.toString() || "0"} for your quotation request #${updatedQuotation.id.slice(0, 8)}`,
        "QUOTE_STATUS_UPDATED",
        "/buyer/quotations"
      )

      return NextResponse.json(updatedQuotation)
    }

    if (role === "BUYER") {
      const { action } = body as { action: "ACCEPT" | "DECLINE" }

      if (!action || !["ACCEPT", "DECLINE"].includes(action)) {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
      }

      if (quotation.status !== QuotationStatus.QUOTED) {
        return NextResponse.json({ error: "Quotation is not in QUOTED state" }, { status: 400 })
      }

      if (action === "DECLINE") {
        const updated = await prisma.quotation.update({
          where: { id },
          data: { status: QuotationStatus.REJECTED },
        })

        // Notify admins
        await notifyAdmins(
          "Quote Declined",
          `Buyer ${session.user.name || "Customer"} (${session.user.companyName || "No Company"}) has declined quotation request #${updated.id.slice(0, 8)}`,
          "QUOTE_STATUS_UPDATED",
          "/admin/quotations"
        )

        return NextResponse.json(updated)
      }

      // ACCEPT -> CONFIRMED
      // Verify and deduct stock
      const updated = await prisma.$transaction(async (tx) => {
        for (const item of quotation.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          })

          if (!product) {
            throw new Error(`Product ${item.productId} not found`)
          }

          const stock = product.stockQuantity.toNumber()
          const reqQty = item.baseQuantity.toNumber()

          if (stock < reqQty) {
            throw new Error(
              `Insufficient stock for product ${product.name}. Available: ${stock} ${product.baseUnit}. Requested: ${reqQty} ${product.baseUnit}`
            )
          }

          // Deduct stock
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                decrement: reqQty,
              },
            },
          })
        }

        return await tx.quotation.update({
          where: { id },
          data: { status: QuotationStatus.CONFIRMED },
        })
      })

      // Notify admins
      await notifyAdmins(
        "Quote Accepted",
        `Buyer ${session.user.name || "Customer"} (${session.user.companyName || "No Company"}) has accepted quotation request #${updated.id.slice(0, 8)} for ₹${quotation.quotedAmount?.toString() || "0"}`,
        "QUOTE_STATUS_UPDATED",
        "/admin/quotations"
      )

      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  } catch (error: any) {
    console.error(`PUT /api/quotations/${params.id} error:`, error)
    return NextResponse.json({ error: error.message }, { status: 400 }) // Return 400 for transactional errors like insufficient stock
  }
}

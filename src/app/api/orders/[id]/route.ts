import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { OrderStatus } from "@prisma/client"

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
    const { status } = body as { status: OrderStatus }

    if (!status || !["CONFIRMED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.status !== OrderStatus.PENDING) {
      return NextResponse.json({ error: "Order is already processed" }, { status: 400 })
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update status
      const updated = await tx.order.update({
        where: { id },
        data: { status },
      })

      // If rejected, refund the stock quantity to products
      if (status === OrderStatus.REJECTED) {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                increment: item.baseQuantity,
              },
            },
          })
        }
      }

      return updated
    })

    return NextResponse.json(updatedOrder)
  } catch (error: any) {
    console.error(`PUT /api/orders/${params.id} error:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

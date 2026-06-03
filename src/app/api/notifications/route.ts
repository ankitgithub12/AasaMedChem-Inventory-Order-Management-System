import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    return NextResponse.json(notifications)
  } catch (error: any) {
    console.error("GET /api/notifications error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { id, all } = body as { id?: string; all?: boolean }

    if (all) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true, message: "All notifications marked as read" })
    }

    if (!id) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 })
    }

    // Verify ownership and update
    const notification = await prisma.notification.findUnique({
      where: { id },
    })

    if (!notification || notification.userId !== session.user.id) {
      return NextResponse.json({ error: "Notification not found or access denied" }, { status: 404 })
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("PUT /api/notifications error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

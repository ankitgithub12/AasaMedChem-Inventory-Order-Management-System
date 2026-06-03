import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import * as bcrypt from "bcryptjs"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyName: true,
        phone: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error"
    console.error("GET /api/profile error:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json() as {
      name?: string
      email?: string
      companyName?: string
      phone?: string
      password?: string
    }
    const { name, email, companyName, phone, password } = body

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    // Check email uniqueness if email has changed
    if (email !== session.user.email) {
      const emailConflict = await prisma.user.findUnique({
        where: { email },
      })
      if (emailConflict) {
        return NextResponse.json({ error: "Email is already in use" }, { status: 400 })
      }
    }

    const updateData: {
      name: string
      email: string
      companyName: string | null
      phone: string | null
      password?: string
    } = {
      name,
      email,
      companyName: companyName || null,
      phone: phone || null,
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyName: true,
        phone: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error"
    console.error("PUT /api/profile error:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

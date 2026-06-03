import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import * as bcrypt from "bcryptjs"
import { Role } from "@prisma/client"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name, role, companyName, phone } = body

    // 1. Required fields check
    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 2. Role safety constraint
    if (role === "ADMIN") {
      return NextResponse.json({ error: "Public administration signup is forbidden" }, { status: 400 })
    }

    if (!["SELLER", "BUYER"].includes(role)) {
      return NextResponse.json({ error: "Invalid registration role" }, { status: 400 })
    }

    // Name validation
    if (name.trim().length < 3) {
      return NextResponse.json({ error: "Name must be at least 3 characters" }, { status: 400 })
    }

    // 3. Password validation
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      return NextResponse.json({ error: "Password must contain both letters and numbers" }, { status: 400 })
    }

    // 4. Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Company Name validation for BUYER
    if (role === "BUYER" && (!companyName || !companyName.trim())) {
      return NextResponse.json({ error: "Company name is required for buyers" }, { status: 400 })
    }

    // Phone validation
    if (phone && !/^\+?[0-9\s\-()]{7,18}$/.test(phone)) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 })
    }

    // 5. Unique email check
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })
    if (existingUser) {
      return NextResponse.json({ error: "Email is already in use" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role as Role,
        companyName: role === "BUYER" ? (companyName || "Individual") : null,
        phone: phone || null,
      },
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

    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    console.error("POST /api/register error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

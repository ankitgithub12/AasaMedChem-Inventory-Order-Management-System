import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { UNIT_DIMENSIONS } from "@/lib/unit-conversion"
import { Unit } from "@prisma/client"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || ""
    const unitDimension = searchParams.get("unit_dimension") || ""
    const isActiveParam = searchParams.get("is_active")

    const userRole = session.user.role

    const where: any = {}

    // Buyers can only see active products
    if (userRole === "BUYER") {
      where.isActive = true;
    } else if (isActiveParam !== null) {
      where.isActive = isActiveParam === "true";
    }

    // Search filter (name or sku)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ]
    }

    // Category filter
    if (category) {
      where.category = category
    }

    // Unit Dimension filter
    if (unitDimension) {
      // Find all units belonging to this dimension
      const compatibleUnits = Object.keys(UNIT_DIMENSIONS).filter(
        (unit) => UNIT_DIMENSIONS[unit] === unitDimension
      ) as Unit[]
      where.baseUnit = { in: compatibleUnits }
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: "asc" },
    })

    // If role is BUYER, mask prices that are not public
    const sanitizedProducts = products.map((product) => {
      if (userRole === "BUYER" && !product.isPricePublic) {
        return {
          ...product,
          basePrice: null, // Price on Request
        }
      }
      return product
    })

    return NextResponse.json(sanitizedProducts)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error"
    console.error("GET /api/products error:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

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

    if (!name || !sku || !baseUnit || basePrice === undefined || stockQuantity === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check SKU uniqueness
    const existingProduct = await prisma.product.findUnique({
      where: { sku },
    })
    if (existingProduct) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        description,
        category,
        baseUnit: baseUnit as Unit,
        basePrice: parseFloat(basePrice),
        stockQuantity: parseFloat(stockQuantity),
        isActive: isActive ?? true,
        isPricePublic: isPricePublic ?? false,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error"
    console.error("POST /api/products error:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

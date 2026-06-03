import { PrismaClient, Role, Unit, OrderStatus, QuotationStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Clear existing data
  await prisma.quotationItem.deleteMany()
  await prisma.quotation.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.user.deleteMany()

  // Hash passwords
  const adminPasswordHash = await bcrypt.hash('admin123', 10)
  const sellerPasswordHash = await bcrypt.hash('seller123', 10)
  const buyerPasswordHash = await bcrypt.hash('buyer123', 10)

  // Seed Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@aasa.com',
      password: adminPasswordHash,
      name: 'Aasa Admin',
      role: Role.ADMIN,
    },
  })

  const seller = await prisma.user.create({
    data: {
      email: 'seller@aasa.com',
      password: sellerPasswordHash,
      name: 'Aasa Seller',
      role: Role.SELLER,
    },
  })

  const buyer = await prisma.user.create({
    data: {
      email: 'buyer@aasa.com',
      password: buyerPasswordHash,
      name: 'Aasa Buyer',
      role: Role.BUYER,
      companyName: 'Test Pharma Co.',
      phone: '+91 98765 43210',
    },
  })

  console.log('Users seeded successfully')

  // Seed Products
  const sodiumChloride = await prisma.product.create({
    data: {
      name: 'Sodium Chloride',
      sku: 'CHEM-NaCl-001',
      description: 'High purity sodium chloride powder for chemical processes.',
      category: 'Chemicals',
      baseUnit: Unit.GRAM,
      basePrice: 0.05, // ₹0.05 / gram
      stockQuantity: 50000.0, // 50000 grams
      isActive: true,
      isPricePublic: true,
    },
  })

  const ethanol = await prisma.product.create({
    data: {
      name: 'Ethanol 99%',
      sku: 'REAG-ETH-002',
      description: '99% pure laboratory-grade ethanol.',
      category: 'Reagents',
      baseUnit: Unit.MILLILITER,
      basePrice: 0.80, // ₹0.80 / mL
      stockQuantity: 20000.0, // 20000 mL
      isActive: true,
      isPricePublic: false,
    },
  })

  const hydrochloricAcid = await prisma.product.create({
    data: {
      name: 'Hydrochloric Acid',
      sku: 'CHEM-HCl-003',
      description: '37% hydrochloric acid reagent grade.',
      category: 'Chemicals',
      baseUnit: Unit.MILLILITER,
      basePrice: 0.30, // ₹0.30 / mL
      stockQuantity: 15000.0, // 15000 mL
      isActive: true,
      isPricePublic: false,
    },
  })

  const glucosePowder = await prisma.product.create({
    data: {
      name: 'Glucose Powder',
      sku: 'REAG-GLU-004',
      description: 'Glucose powder anhydrous laboratory-grade.',
      category: 'Reagents',
      baseUnit: Unit.GRAM,
      basePrice: 0.12, // ₹0.12 / gram
      stockQuantity: 30000.0, // 30000 grams
      isActive: true,
      isPricePublic: true,
    },
  })

  const labGloves = await prisma.product.create({
    data: {
      name: 'Lab Gloves (Box)',
      sku: 'EQUIP-GLV-005',
      description: 'Nitrile powder-free laboratory examination gloves, size M.',
      category: 'Equipment',
      baseUnit: Unit.UNIT,
      basePrice: 350.00, // ₹350.00 / box unit
      stockQuantity: 200.0, // 200 boxes
      isActive: true,
      isPricePublic: true,
    },
  })

  const distilledWater = await prisma.product.create({
    data: {
      name: 'Distilled Water',
      sku: 'REAG-H2O-006',
      description: 'Deionized distilled water for laboratory reagents.',
      category: 'Reagents',
      baseUnit: Unit.MILLILITER, // LITER base price ₹15/L -> internally stored as MILLILITER ₹0.015/mL
      basePrice: 0.015,
      stockQuantity: 40000.0, // 40,000 mL (40 Liters)
      isActive: true,
      isPricePublic: true,
    },
  })

  const calciumCarbonate = await prisma.product.create({
    data: {
      name: 'Calcium Carbonate',
      sku: 'CHEM-CaCO3-007',
      description: 'Calcium Carbonate precipated powder.',
      category: 'Chemicals',
      baseUnit: Unit.GRAM, // KILOGRAM base price ₹80/kg -> internally stored as GRAM ₹0.08/g
      basePrice: 0.08,
      stockQuantity: 25000.0, // 25,000 grams (25 kg)
      isActive: true,
      isPricePublic: true,
    },
  })

  const petriDishes = await prisma.product.create({
    data: {
      name: 'Petri Dishes (Pack)',
      sku: 'EQUIP-PET-008',
      description: 'Sterile plastic petri dishes with lids, 90mm diameter.',
      category: 'Equipment',
      baseUnit: Unit.UNIT,
      basePrice: 120.00, // ₹120.00 / unit pack
      stockQuantity: 500.0, // 500 packs
      isActive: true,
      isPricePublic: true,
    },
  })

  console.log('Products seeded successfully')

  // Seed 1 Seller Order (PENDING) with 2 line items showing different units
  // Item 1: Sodium Chloride (ordered: 2 KILOGRAM = 2000 GRAM)
  // Item 2: Lab Gloves (Box) (ordered: 5 UNIT)
  const scQty = 2 // 2 kg
  const scBaseQty = scQty * 1000 // 2000 g
  const scPriceAtOrder = sodiumChloride.basePrice.toNumber()
  const scLineTotal = scBaseQty * scPriceAtOrder // 2000 * 0.05 = ₹100.00

  const lgQty = 5 // 5 boxes
  const lgBaseQty = lgQty * 1 // 5 units
  const lgPriceAtOrder = labGloves.basePrice.toNumber()
  const lgLineTotal = lgBaseQty * lgPriceAtOrder // 5 * 350 = ₹1750.00

  const orderTotal = scLineTotal + lgLineTotal // 1850.00

  const order = await prisma.order.create({
    data: {
      sellerId: seller.id,
      status: OrderStatus.PENDING,
      totalAmount: orderTotal,
      notes: 'Urgent chemical order for local lab client.',
      items: {
        create: [
          {
            productId: sodiumChloride.id,
            orderedUnit: Unit.KILOGRAM,
            orderedQuantity: scQty,
            baseQuantity: scBaseQty,
            unitPriceAtOrder: scPriceAtOrder,
            lineTotal: scLineTotal,
          },
          {
            productId: labGloves.id,
            orderedUnit: Unit.UNIT,
            orderedQuantity: lgQty,
            baseQuantity: lgBaseQty,
            unitPriceAtOrder: lgPriceAtOrder,
            lineTotal: lgLineTotal,
          },
        ],
      },
    },
  })

  console.log('Sample Seller Order seeded successfully')

  // Seed 1 Buyer Quotation (QUOTED status) with Admin pricing filled in
  // Item: Ethanol 99% (requested: 5 LITER = 5000 MILLILITER)
  const etQty = 5 // 5 Liters
  const etBaseQty = etQty * 1000 // 5000 mL
  const etQuotedPrice = 0.80 // Admin quotes ₹0.80 per mL (same as base price)
  const etLineTotal = etBaseQty * etQuotedPrice // 5000 * 0.80 = ₹4000.00

  const quotation = await prisma.quotation.create({
    data: {
      buyerId: buyer.id,
      status: QuotationStatus.QUOTED,
      buyerNotes: 'Need 5 Liters of 99% Ethanol for testing. Can we get standard pricing?',
      adminNotes: 'Standard pricing applied. Lead time is 2 days.',
      quotedAmount: etLineTotal,
      items: {
        create: [
          {
            productId: ethanol.id,
            requestedUnit: Unit.LITER,
            requestedQuantity: etQty,
            baseQuantity: etBaseQty,
            quotedUnitPrice: etQuotedPrice,
            lineTotal: etLineTotal,
          },
        ],
      },
    },
  })

  console.log('Sample Buyer Quotation seeded successfully')
  console.log('Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

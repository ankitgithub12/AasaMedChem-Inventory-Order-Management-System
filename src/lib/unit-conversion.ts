export const UNIT_DIMENSIONS: Record<string, 'weight' | 'volume' | 'count'> = {
  GRAM: 'weight',
  KILOGRAM: 'weight',
  LITER: 'volume',
  MILLILITER: 'volume',
  UNIT: 'count',
}

export const TO_BASE_FACTOR: Record<string, number> = {
  GRAM: 1,
  KILOGRAM: 1000,
  MILLILITER: 1,
  LITER: 1000,
  UNIT: 1,
}

// Convert any quantity to base unit
export function toBaseUnit(quantity: number, unit: string): number {
  return quantity * TO_BASE_FACTOR[unit]
}

// Convert base unit quantity to display unit
export function fromBaseUnit(quantity: number, unit: string): number {
  return quantity / TO_BASE_FACTOR[unit]
}

// Calculate line total: converts ordered qty to base, multiplies by base price
export function calculateLineTotal(
  orderedQty: number,
  orderedUnit: string,
  basePricePerBaseUnit: number
): number {
  const baseQty = toBaseUnit(orderedQty, orderedUnit)
  return parseFloat((baseQty * basePricePerBaseUnit).toFixed(6))
}

// Get effective price per ordered unit (for display)
export function pricePerOrderedUnit(
  basePricePerBaseUnit: number,
  orderedUnit: string
): number {
  return basePricePerBaseUnit * TO_BASE_FACTOR[orderedUnit]
}

// Get all units compatible with a given base unit
export function getCompatibleUnits(baseUnit: string): string[] {
  const dim = UNIT_DIMENSIONS[baseUnit]
  return Object.keys(UNIT_DIMENSIONS).filter(u => UNIT_DIMENSIONS[u] === dim)
}

// Validate that ordered unit is compatible with product's base unit
export function isUnitCompatible(baseUnit: string, orderedUnit: string): boolean {
  return UNIT_DIMENSIONS[baseUnit] === UNIT_DIMENSIONS[orderedUnit]
}

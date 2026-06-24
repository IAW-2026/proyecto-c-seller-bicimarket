import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Categories considered "complete bikes"
const BIKE_CATEGORIES = new Set(['mtb', 'road', 'urban', 'kids', 'bmx'])

// random integer in [min, max], rounded to `step` (in pesos)
function pesos(min: number, max: number, step: number): number {
  const raw = min + Math.random() * (max - min)
  return Math.round(raw / step) * step
}

async function main() {
  console.log('💲 Fixing seed product prices...\n')

  // Only the seed products
  const products = await prisma.product.findMany({
    where: { id: { startsWith: 'prd_slp_seller_' } },
    select: { id: true, title: true, category: true },
    orderBy: { id: 'asc' },
  })

  let bikes = 0
  let rest = 0

  for (const p of products) {
    let priceArs: number
    if (BIKE_CATEGORIES.has(p.category)) {
      priceArs = pesos(500_000, 1_000_000, 10_000) // $500k – $1M, step $10k
      bikes++
    } else {
      priceArs = pesos(20_000, 100_000, 1_000)     // ≤ $100k, step $1k
      rest++
    }
    const priceCents = priceArs * 100

    await prisma.product.update({
      where: { id: p.id },
      data: { priceCents },
    })

    const tag = BIKE_CATEGORIES.has(p.category) ? '🚲' : '🔧'
    console.log(`  ${tag} ${p.category.padEnd(12)} $${priceArs.toLocaleString('es-AR').padStart(11)}  ${p.title}`)
  }

  console.log(`\n✅ Updated ${products.length} products (${bikes} bikes, ${rest} accessories/parts).`)
}

main()
  .catch(e => { console.error('❌ Failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())

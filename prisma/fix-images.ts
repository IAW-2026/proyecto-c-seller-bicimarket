import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const prisma = new PrismaClient()

// ── Verified image pool (prisma/_images.txt: "keyword<TAB>url", HTTP-200 images only) ──
const POOLS: Record<string, string[]> = {}
const raw = readFileSync(join(__dirname, '_images.txt'), 'utf8')
for (const line of raw.split('\n')) {
  const [kw, url] = line.split('\t')
  if (!kw || !url) continue
  ;(POOLS[kw] ??= []).push(url.trim())
}

// ── Keyword per product template, in seed order (productIdx 0..39) ──
// Matches PRODUCT_TEMPLATES order in seed-seller.ts exactly.
const KEYWORD_BY_INDEX = [
  'mountain,bike',    // 0  Trek Marlin 5 (mtb)
  'mountain,bike',    // 1  Specialized Rockhopper (mtb)
  'road,bicycle',     // 2  Venzo R35 (road)
  'folding,bicycle',  // 3  Raleigh P20 plegable (urban)
  'bicycle,tire',     // 4  Cubierta Continental (parts)
  'bicycle,cassette', // 5  Casete Shimano Deore (parts)
  'bicycle,helmet',   // 6  Casco Specialized (accessories)
  'cycling,gloves',   // 7  Guantes Fox (indumentaria)
  'mountain,bike',    // 8  KTM XC (mtb)
  'bicycle,pedal',    // 9  Pedales Shimano (parts)
  'kids,bicycle',     // 10 Bici infantil Firebird (kids)
  'bmx,bike',         // 11 BMX GT Performer (bmx)
  'bicycle,fork',     // 12 Horquilla Fox 36 (parts)
  'bicycle,saddle',   // 13 Sillín Fizik (parts)
  'bicycle,cassette', // 14 Rodado libre SRAM (parts)
  'cycling,shoes',    // 15 Zapatillas Shimano (indumentaria)
  'bicycle,lock',     // 16 Candado ABUS (accessories)
  'mountain,bike',    // 17 Vairo XR 3.0 (mtb)
  'road,bicycle',     // 18 Olmo Road Master (road)
  'bicycle,saddle',   // 19 Sillín infantil con luz (kids)
  'bicycle,chain',    // 20 Cadena Shimano (parts)
  'bicycle,light',    // 21 Luz Lezyne (accessories)
  'cycling,jersey',   // 22 Remera Fox (indumentaria)
  'city,bicycle',     // 23 GW Tracker urbana (urban)
  'bicycle,brake',    // 24 Freno disco Shimano (parts)
  'mountain,bike',    // 25 Top Mega R29 Carbon (mtb)
  'bicycle,tire',     // 26 Cubierta Pirelli (parts)
  'kids,bicycle',     // 27 Bici infantil Vairo (kids)
  'bicycle,tools',    // 28 Kit herramientas Park Tool (accessories)
  'bicycle,pedal',    // 29 Calas Shimano (parts)
  'bmx,bike',         // 30 BMX Sunday (bmx)
  'cycling,backpack', // 31 Mochila CamelBak (accessories)
  'road,bicycle',     // 32 Bici ruta Endurance (road)
  'bicycle,handlebar',// 33 Puño Ergon (parts)
  'cycling,shorts',   // 34 Short Fox (indumentaria)
  'mountain,bike',    // 35 Benotto R29 (mtb)
  'bicycle,pump',     // 36 Bomba Topeak (accessories)
  'cycling,shorts',   // 37 Culote Castelli (indumentaria)
  'folding,bicycle',  // 38 KTM Commuter plegable (urban)
  'bicycle,cassette', // 39 Rodado Shimano 105 (parts)
]

// Fallback keyword by category if a pool came up empty (~10% tolerance).
const CATEGORY_FALLBACK: Record<string, string> = {
  mtb: 'mountain,bike',
  road: 'road,bicycle',
  urban: 'city,bicycle',
  kids: 'kids,bicycle',
  bmx: 'bmx,bike',
  parts: 'bicycle,tire',
  accessories: 'bicycle,helmet',
  indumentaria: 'cycling,jersey',
}

const SELLER_IDS = Array.from({ length: 10 }, (_, i) => `slp_seller_${String(i + 1).padStart(3, '0')}`)

// Round-robin cursor per keyword so different products get different images from the pool.
const cursor: Record<string, number> = {}
function pickTwo(keyword: string, category: string): [string, string] | null {
  let pool = POOLS[keyword]
  if (!pool || pool.length === 0) pool = POOLS[CATEGORY_FALLBACK[category]]
  if (!pool || pool.length === 0) return null
  const i = cursor[keyword] ?? 0
  cursor[keyword] = i + 2
  const url1 = pool[i % pool.length]
  const url2 = pool.length > 1 ? pool[(i + 1) % pool.length] : pool[0]
  return [url1, url2]
}

async function main() {
  console.log('🔧 Fixing product images (relevant per product)...\n')

  let fixed = 0
  let skipped = 0
  let productIdx = 0

  for (const sellerId of SELLER_IDS) {
    for (let p = 1; p <= 4; p++) {
      const productId = `prd_${sellerId}_${p}`
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, category: true, title: true },
      })
      if (!product) { productIdx++; continue }

      const keyword = KEYWORD_BY_INDEX[productIdx % KEYWORD_BY_INDEX.length]
      const urls = pickTwo(keyword, product.category)

      if (!urls) {
        console.log(`  ⚠ no image for ${product.title} (${keyword}) — left as is`)
        skipped++
        productIdx++
        continue
      }

      await prisma.productImage.deleteMany({ where: { productId } })
      await prisma.productImage.createMany({
        data: [
          { productId, url: urls[0], position: 0 },
          { productId, url: urls[1], position: 1 },
        ],
      })
      console.log(`  ✓ ${keyword.padEnd(18)} ${product.title}`)
      fixed++
      productIdx++
    }
  }

  console.log(`\n✅ Fixed ${fixed} products, ${skipped} skipped (no pool).`)
}

main()
  .catch(e => { console.error('❌ Failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())

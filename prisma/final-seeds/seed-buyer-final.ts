/**
 * BiciMarket demo v3 - Buyer App seed.
 *
 * Copy this file to `prisma/seed.ts` in the Buyer project.
 * Required: SEED_ANCHOR_DATE=YYYY-MM-DD
 * Writes only when: SEED_ALLOW_RESET=BICIMARKET_DEMO
 * Dry run: SEED_DRY_RUN=1
 */
import { createHash } from 'node:crypto'
import { PrismaClient } from '../src/generated/prisma/client'

const SCENARIO = 'bicimarket-demo-v3'
const ORDER_COUNT = 2400
const BUYER_COUNT = 500
const SELLER_COUNT = 40
const PRODUCTS_PER_SELLER = 8
const BATCH_SIZE = Math.max(50, Number(process.env.SEED_BATCH_SIZE ?? 500))

type PaymentState = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded'
type ShipmentState = 'created' | 'ready_for_pickup' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed_delivery' | 'returned'

type Postal = { cp: string; lat: number; lng: number; city: string; province: string }
const POSTALS: Postal[] = [
  { cp: 'C1043', lat: -34.6037, lng: -58.4044, city: 'Almagro', province: 'Buenos Aires' },
  { cp: 'C1406', lat: -34.6190, lng: -58.4427, city: 'Caballito', province: 'Buenos Aires' },
  { cp: 'C1425', lat: -34.5895, lng: -58.4222, city: 'Palermo', province: 'Buenos Aires' },
  { cp: 'C1426', lat: -34.5810, lng: -58.4380, city: 'Palermo', province: 'Buenos Aires' },
  { cp: 'B1642', lat: -34.4690, lng: -58.5180, city: 'San Isidro', province: 'Buenos Aires' },
  { cp: 'B1629', lat: -34.4580, lng: -58.9070, city: 'Pilar', province: 'Buenos Aires' },
  { cp: 'B1878', lat: -34.7170, lng: -58.2580, city: 'Quilmes', province: 'Buenos Aires' },
  { cp: 'B1900', lat: -34.9214, lng: -57.9544, city: 'La Plata', province: 'Buenos Aires' },
  { cp: 'B8000', lat: -38.7196, lng: -62.2724, city: 'Bahía Blanca', province: 'Buenos Aires' },
  { cp: 'B7600', lat: -38.0055, lng: -57.5426, city: 'Mar del Plata', province: 'Buenos Aires' },
  { cp: 'S2000', lat: -32.9587, lng: -60.6930, city: 'Rosario', province: 'Santa Fe' },
  { cp: 'X5000', lat: -31.4201, lng: -64.1888, city: 'Córdoba', province: 'Córdoba' },
  { cp: 'M5500', lat: -32.8908, lng: -68.8272, city: 'Mendoza', province: 'Mendoza' },
  { cp: 'T4000', lat: -26.8083, lng: -65.2176, city: 'San Miguel de Tucumán', province: 'Tucumán' },
  { cp: 'A4400', lat: -24.7821, lng: -65.4232, city: 'Salta', province: 'Salta' },
  { cp: 'E3100', lat: -31.7333, lng: -60.5290, city: 'Paraná', province: 'Entre Ríos' },
  { cp: 'N3300', lat: -27.3621, lng: -55.9007, city: 'Posadas', province: 'Misiones' },
  { cp: 'Q8300', lat: -38.9516, lng: -68.0591, city: 'Neuquén', province: 'Neuquén' },
  { cp: 'R8400', lat: -41.1335, lng: -71.3103, city: 'San Carlos de Bariloche', province: 'Río Negro' },
  { cp: 'U9000', lat: -45.8651, lng: -67.4980, city: 'Comodoro Rivadavia', province: 'Chubut' },
]

const CATALOG = [
  { category: 'mtb', price: 82_000_000, step: 3_100_000, weight: 13_200, weightStep: 180, dims: [180, 60, 110], products: 'Trek Marlin 5~trek-marlin-5|Specialized Rockhopper~specialized-rockhopper|Venzo Raptor~venzo-raptor|Vairo XR 3.0~vairo-xr-3-0|Scott Aspect 930~scott-aspect-930|Cannondale Trail 5~cannondale-trail-5|Giant Talon 1~giant-talon-1|Merida Big Nine 300~merida-big-nine-300|GT Avalanche Comp~gt-avalanche-comp|Zenith Cima 29~zenith-cima-29' },
  { category: 'road', price: 96_000_000, step: 4_200_000, weight: 7_900, weightStep: 120, dims: [175, 52, 98], products: 'Venzo R35~venzo-r35|Trek Domane AL 2~trek-domane-al-2|Specialized Allez~specialized-allez|Giant Contend AR~giant-contend-ar|Cannondale CAAD13~cannondale-caad13|Scott Speedster 20~scott-speedster-20|Merida Scultura 400~merida-scultura-400|Bianchi Via Nirone~bianchi-via-nirone|Orbea Avant H40~orbea-avant-h40|Wilier GTR Team~wilier-gtr-team' },
  { category: 'urban', price: 52_000_000, step: 2_300_000, weight: 11_500, weightStep: 190, dims: [170, 48, 100], products: 'Raleigh Classic Urban~raleigh-classic-urban|Raleigh P20 Folding~raleigh-p20-folding|Olmo Amsterdam~olmo-amsterdam|Vairo Metro 1.0~vairo-metro-1-0|Giant Escape 3~giant-escape-3|Trek FX 1~trek-fx-1|Specialized Sirrus 2.0~specialized-sirrus-2-0|Cannondale Quick 5~cannondale-quick-5|Volta E-Bike City~volta-e-bike-city|Aurora Classic 26~aurora-classic-26' },
  { category: 'kids', price: 31_000_000, step: 1_700_000, weight: 7_800, weightStep: 210, dims: [135, 38, 78], products: 'Firebird Explorer 12~firebird-explorer-12|Firebird Explorer 16~firebird-explorer-16|Firebird Explorer 20~firebird-explorer-20|Vairo Kids 16~vairo-kids-16|Vairo Kids 20~vairo-kids-20|Trek Precaliber 16~trek-precaliber-16|Trek Precaliber 20~trek-precaliber-20|Specialized Jett 20~specialized-jett-20|Giant XTC Junior 20~giant-xtc-jr-20|Cannondale Kids Trail 20~cannondale-kids-trail-20' },
  { category: 'bmx', price: 48_000_000, step: 2_600_000, weight: 10_500, weightStep: 150, dims: [155, 42, 85], products: 'GT Performer 20~gt-performer-20|Sunday Primer~sunday-primer|WeThePeople Arcade~wethepeople-arcade|Mongoose Legion L20~mongoose-legion-l20|Mongoose Legion L40~mongoose-legion-l40|Haro Downtown~haro-downtown|Fit PRK~fit-prk|Cult Gateway~cult-gateway|Kink Curb~kink-curb|Subrosa Tiro~subrosa-tiro' },
  { category: 'parts', price: 5_500_000, step: 1_350_000, weight: 420, weightStep: 210, dims: [40, 30, 20], products: 'Shimano Deore M6100 Cassette~shimano-deore-m6100-cassette|Shimano SLX M7100 Derailleur~shimano-slx-m7100-derailleur|Shimano XT M8100 Crankset~shimano-xt-m8100-crankset|Shimano MT200 Brakes~shimano-mt200-brakes|SRAM GX Eagle Cassette~sram-gx-eagle-cassette|Fox 36 Float Factory~fox-36-float-factory|Continental Race King 29~continental-race-king-29|Fizik Antares R1~fizik-antares-r1|DT Swiss M1900 Wheelset~dt-swiss-m1900-wheelset|Shimano PD-M520 Pedals~shimano-pd-m520-pedals' },
  { category: 'accessories', price: 2_800_000, step: 850_000, weight: 250, weightStep: 170, dims: [35, 30, 20], products: 'Specialized Align II MIPS Helmet~specialized-align-ii-mips-helmet|Abus Bordo 6000 Lock~abus-bordo-6000-lock|Lezyne Macro Drive 1200 Light~lezyne-macro-drive-1200-light|CamelBak MULE Backpack~camelbak-mule-backpack|Topeak JoeBlow Pump~topeak-joe-blow-pump|Garmin Edge 530 Computer~garmin-edge-530-computer|Thule ProRide Rack~thule-pro-ride-rack|Fidlock Twist Bottle~fidlock-twist-bottle|Topeak Wedge Saddle Bag~topeak-wedge-saddle-bag|Park Tool PCS-10 Stand~park-tool-pcs-10-stand' },
  { category: 'indumentaria', price: 3_200_000, step: 720_000, weight: 180, weightStep: 55, dims: [35, 25, 8], products: 'Fox Ranger Jersey~fox-ranger-jersey|Fox Ranger Shorts~fox-ranger-shorts|Castelli Rosso Corsa Bib~castelli-rosso-corsa-bib|Castelli Perfetto Jacket~castelli-perfetto-jacket|Giro Bravo Gel Gloves~giro-bravo-gel-gloves|Shimano XC501 Shoes~shimano-xc501-shoes|Shimano RC502 Shoes~shimano-rc502-shoes|Oakley Sutro Glasses~oakley-sutro-glasses|Craft Active Base Layer~craft-active-base-layer|Endura Hummvee Pants~endura-hummvee-pants' },
] as const

function listingProduct(seller: number, slot: number) {
  const category = CATALOG[slot - 1]
  const baseIndex = ((seller - 1) + (slot - 1) * 3) % 10
  const [title, slug] = category.products.split('|')[baseIndex].split('~')
  return { title, slug, category: category.category, price: category.price + baseIndex * category.step + seller * 125_000, weight: category.weight + baseIndex * category.weightStep, dims: category.dims }
}

function hash(text: string): number {
  let value = 2166136261
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i)
    value = Math.imul(value, 16777619)
  }
  return value >>> 0
}
function int(key: string, max: number): number { return hash(`${SCENARIO}:${key}`) % max }
function pad(value: number, size: number): string { return String(value).padStart(size, '0') }
function addDays(date: Date, days: number): Date { const d = new Date(date); d.setUTCDate(d.getUTCDate() + days); return d }
function addHours(date: Date, hours: number): Date { const d = new Date(date); d.setUTCHours(d.getUTCHours() + hours); return d }
function minDate(a: Date, b: Date): Date { return a < b ? a : b }
function requireAnchor(): Date {
  const raw = process.env.SEED_ANCHOR_DATE
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new Error('SEED_ANCHOR_DATE=YYYY-MM-DD is required')
  const date = new Date(`${raw}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) throw new Error('Invalid SEED_ANCHOR_DATE')
  return date
}

const ANCHOR = requireAnchor()
const START = addDays(ANCHOR, -730)

const buyerId = (n: number) => `byp_demo_${pad(n, 4)}`
const buyerClerkId = (n: number) => `user_buyer_demo_${pad(n, 4)}`
const sellerId = (n: number) => `slp_demo_${pad(n, 3)}`
const productId = (seller: number, slot: number) => `prd_demo_${pad(seller, 3)}_${pad(slot, 2)}`
const orderId = (n: number) => `ord_demo_${pad(n, 5)}`
const paymentId = (n: number) => `pay_demo_${pad(n, 5)}`
const groupId = (order: number, seller: number) => `osg_demo_${pad(order, 5)}_${pad(seller, 3)}`
const salesOrderId = (order: number, seller: number) => `sor_demo_${pad(order, 5)}_${pad(seller, 3)}`
const quoteId = (order: number, seller: number) => `qte_demo_${pad(order, 5)}_${pad(seller, 3)}`
const shipmentId = (order: number, seller: number) => `shp_demo_${pad(order, 5)}_${pad(seller, 3)}`

function buildBuyerAssignments(): number[] {
  const result = Array<number>(ORDER_COUNT + 1).fill(0)
  const used = new Set<number>()
  for (let k = 0; k < 130; k++) { const position = Math.floor(((k + 0.5) * 2055) / 130) + 1; used.add(position); result[position] = 51 + k }
  for (let k = 0; k < 120; k++) { const position = 2056 + Math.floor(((k + 0.5) * 345) / 120); used.add(position); result[position] = 181 + k }
  const recent = Array.from({ length: 345 }, (_, i) => 2056 + i).filter(i => !used.has(i))
  for (let n = 0; n < 200; n++) { const selected = int(`recent-repeat-slot:${n}`, recent.length); const position = recent.splice(selected, 1)[0]; used.add(position); result[position] = 301 + n }
  const available = Array.from({ length: ORDER_COUNT }, (_, i) => i + 1).filter(i => !used.has(i))
  for (let n = 0; n < 200; n++) {
    const selected = int(`repeat-slot:${n}`, available.length)
    const position = available.splice(selected, 1)[0]
    result[position] = 301 + n
  }
  for (const position of available) result[position] = 301 + int(`buyer:${position}`, 200)
  return result
}
const BUYER_BY_ORDER = buildBuyerAssignments()

function orderDate(n: number): Date {
  const day = n <= 1000
    ? Math.floor(((n - 1) * 365) / 1000)
    : 365 + Math.floor(((n - 1001) * 365) / 1400)
  const date = addDays(START, day)
  date.setUTCHours(8 + int(`hour:${n}`, 14), int(`minute:${n}`, 60), 0, 0)
  return date
}
function paymentState(n: number): PaymentState {
  const bucket = (n * 37) % 100
  if (bucket < 92) return 'approved'
  if (bucket < 95) return 'rejected'
  if (bucket < 97) return 'pending'
  if (bucket < 99) return 'cancelled'
  return 'refunded'
}
function groupCount(n: number): number { const r = int(`groups:${n}`, 100); return r < 72 ? 1 : r < 95 ? 2 : 3 }
function postalForBuyer(n: number): Postal {
  const pool = int(`buyer-zone:${n}`, 100) < 55 ? POSTALS.slice(0, 8) : POSTALS
  return pool[int(`buyer-postal:${n}`, pool.length)]
}
function postalForSeller(n: number): Postal { return POSTALS[(n * 7) % POSTALS.length] }
function distanceKm(a: Postal, b: Postal): number {
  const rad = (v: number) => (v * Math.PI) / 180
  const dLat = rad(b.lat - a.lat); const dLng = rad(b.lng - a.lng)
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)))
}

type ItemSpec = { id: string; productId: string; name: string; price: number; quantity: number; weight: number }
type GroupSpec = {
  seller: number; id: string; salesOrderId: string; quoteId: string; shipmentId: string
  items: ItemSpec[]; subtotal: number; weight: number; shippingCost: number; service: 'standard' | 'express' | 'same_day'
  shipmentStatus: ShipmentState | null; shipmentCreatedAt: Date | null; deliveredAt: Date | null
}
type OrderSpec = { n: number; id: string; buyer: number; createdAt: Date; payment: PaymentState; groups: GroupSpec[]; itemsTotal: number; shippingTotal: number; total: number }

function shipmentState(n: number, group: number, state: PaymentState, age: number): ShipmentState | null {
  if (state === 'pending' || state === 'rejected' || state === 'cancelled') return null
  const r = int(`shipment-state:${n}:${group}`, 100)
  if (state === 'refunded') return r < 25 ? null : r < 62 ? 'returned' : 'failed_delivery'
  if (age <= 2) return r < 30 ? null : r < 55 ? 'created' : r < 80 ? 'ready_for_pickup' : r < 95 ? 'picked_up' : 'in_transit'
  if (age <= 5) return r < 10 ? 'created' : r < 30 ? 'ready_for_pickup' : r < 55 ? 'picked_up' : r < 85 ? 'in_transit' : r < 95 ? 'out_for_delivery' : 'delivered'
  if (age <= 9) return r < 5 ? 'ready_for_pickup' : r < 15 ? 'picked_up' : r < 40 ? 'in_transit' : r < 65 ? 'out_for_delivery' : r < 95 ? 'delivered' : r < 98 ? 'failed_delivery' : 'returned'
  return r < 82 ? 'delivered' : r < 86 ? 'in_transit' : r < 89 ? 'out_for_delivery' : r < 92 ? 'ready_for_pickup' : r < 94 ? 'picked_up' : r < 97 ? 'failed_delivery' : r < 99 ? 'returned' : 'created'
}

function makeOrder(n: number): OrderSpec {
  const buyer = BUYER_BY_ORDER[n]
  const createdAt = orderDate(n)
  const payState = paymentState(n)
  const destination = postalForBuyer(buyer)
  const groups: GroupSpec[] = []
  const used = new Set<number>()
  for (let g = 0; g < groupCount(n); g++) {
    let seller = 1 + ((int(`seller:${n}`, 32) + g * 11) % 32)
    while (used.has(seller)) seller = (seller % 32) + 1
    used.add(seller)
    const items: ItemSpec[] = []
    const slots = new Set<number>()
    const count = 1 + int(`item-count:${n}:${g}`, 3)
    for (let j = 0; j < count; j++) {
      let slot = 1 + ((int(`item-slot:${n}:${g}`, 8) + j * 3) % 8)
      while (slots.has(slot)) slot = (slot % 8) + 1
      slots.add(slot)
      const template = listingProduct(seller, slot)
      const quantity = int(`quantity:${n}:${g}:${j}`, 100) < 18 ? 2 : 1
      items.push({
        id: `oit_demo_${pad(n, 5)}_${pad(seller, 3)}_${j + 1}`,
        productId: productId(seller, slot), name: template.title,
        price: template.price, quantity, weight: template.weight,
      })
    }
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const weight = items.reduce((sum, item) => sum + item.weight * item.quantity, 0)
    const distance = distanceKm(postalForSeller(seller), destination)
    const service = distance <= 50 && int(`service:${n}:${g}`, 100) < 25 ? 'same_day'
      : distance <= 700 && int(`service:${n}:${g}`, 100) < 45 ? 'express' : 'standard'
    const base = service === 'same_day' ? 3_000_000 : service === 'express' ? 1_500_000 : 800_000
    const shippingCost = base + Math.min(distance, 5000) * 1000 + Math.ceil(weight / 1000) * 20_000
    const age = Math.floor((ANCHOR.getTime() - createdAt.getTime()) / 86_400_000)
    let status = shipmentState(n, g, payState, age)
    const shipmentCreatedAt = status ? minDate(addDays(createdAt, 1 + int(`ship-delay:${n}:${g}`, 3)), addHours(ANCHOR, -1)) : null
    const eta = service === 'same_day' ? 1 : service === 'express' ? 3 : 6
    let deliveredAt = status === 'delivered' && shipmentCreatedAt ? addDays(shipmentCreatedAt, 1 + int(`delivery-days:${n}:${g}`, eta)) : null
    if (deliveredAt && deliveredAt >= ANCHOR) { deliveredAt = null; status = 'out_for_delivery' }
    groups.push({ seller, id: groupId(n, seller), salesOrderId: salesOrderId(n, seller), quoteId: quoteId(n, seller), shipmentId: shipmentId(n, seller), items, subtotal, weight, shippingCost, service, shipmentStatus: status, shipmentCreatedAt, deliveredAt })
  }
  const itemsTotal = groups.reduce((sum, g) => sum + g.subtotal, 0)
  const shippingTotal = groups.reduce((sum, g) => sum + g.shippingCost, 0)
  return { n, id: orderId(n), buyer, createdAt, payment: payState, groups, itemsTotal, shippingTotal, total: itemsTotal + shippingTotal }
}

function buyerOrderStatus(order: OrderSpec): string {
  if (order.payment === 'pending') return 'PENDING_PAYMENT'
  if (order.payment === 'rejected') return 'PAYMENT_FAILED'
  if (order.payment === 'cancelled') return 'CANCELLED'
  if (order.payment === 'refunded') return 'REFUNDED'
  const statuses = order.groups.map(g => g.shipmentStatus)
  if (statuses.every(s => s === 'delivered')) return int(`complete:${order.n}`, 100) < 65 ? 'COMPLETED' : 'DELIVERED'
  if (statuses.some(s => s === 'returned')) return 'REFUNDED'
  if (statuses.some(s => s === 'delivered')) return 'PARTIALLY_SHIPPED'
  if (statuses.some(s => ['picked_up', 'in_transit', 'out_for_delivery', 'failed_delivery'].includes(String(s)))) return 'SHIPPED'
  if (statuses.some(s => s === 'created' || s === 'ready_for_pickup')) return 'PREPARING'
  return 'PAID'
}
function sellerGroupStatus(order: OrderSpec, group: GroupSpec): string {
  const status = group.shipmentStatus
  if (order.payment === 'cancelled') return 'CANCELLED'
  if (order.payment === 'refunded' || status === 'returned') return 'REFUNDED'
  if (status === 'delivered') return int(`settled-group:${order.n}:${group.seller}`, 100) < 72 ? 'SETTLED' : 'DELIVERED'
  if (status === 'ready_for_pickup') return 'READY_TO_SHIP'
  if (status && ['picked_up', 'in_transit', 'out_for_delivery', 'failed_delivery'].includes(status)) return 'IN_TRANSIT'
  if (status === 'created') return 'PREPARING'
  return 'PENDING'
}
function shippingStatus(status: ShipmentState | null): string | null { return status ? status.toUpperCase() : null }
function address(postal: Postal, n: number) {
  const streets = ['Av. San Martín', 'Belgrano', 'Mitre', 'Sarmiento', 'Av. Rivadavia', '9 de Julio', 'Las Heras', 'Av. Colón']
  return { street: streets[int(`street:${n}`, streets.length)], number: String(100 + int(`number:${n}`, 8900)), apartment: int(`apt:${n}`, 3) === 0 ? `${1 + int(`floor:${n}`, 15)}${String.fromCharCode(65 + int(`unit:${n}`, 4))}` : null, city: postal.city, province: postal.province, postalCode: postal.cp, country: 'AR' }
}
function transitions(finalStatus: string): string[] {
  if (finalStatus === 'PENDING_PAYMENT') return ['PENDING_PAYMENT']
  if (finalStatus === 'PAYMENT_FAILED') return ['PENDING_PAYMENT', 'PAYMENT_FAILED']
  if (finalStatus === 'CANCELLED') return ['PENDING_PAYMENT', 'CANCELLED']
  if (finalStatus === 'REFUNDED') return ['PENDING_PAYMENT', 'PAID', 'REFUNDED']
  const flow = ['PENDING_PAYMENT', 'PAID', 'PREPARING', 'PARTIALLY_SHIPPED', 'SHIPPED', 'DELIVERED', 'COMPLETED']
  return flow.slice(0, flow.indexOf(finalStatus) + 1)
}
async function createManyBatched(model: { createMany(args: any): Promise<any> }, data: any[]) {
  for (let i = 0; i < data.length; i += BATCH_SIZE) await model.createMany({ data: data.slice(i, i + BATCH_SIZE) })
}
function scenarioFingerprint(orders: OrderSpec[]): string {
  const canonical = orders.flatMap(o => [o.id, buyerId(o.buyer), paymentId(o.n), o.payment, ...o.groups.flatMap(g => [g.id, g.salesOrderId, g.quoteId, g.shipmentId, String(g.subtotal), String(g.shippingCost), String(g.shipmentStatus), ...g.items.map(i => i.productId)])]).join('|')
  return createHash('sha256').update(canonical).digest('hex')
}

async function main() {
  const orders = Array.from({ length: ORDER_COUNT }, (_, i) => makeOrder(i + 1))
  const fingerprint = scenarioFingerprint(orders)
  const groups = orders.flatMap(o => o.groups)
  if (new Set(orders.map(o => o.id)).size !== ORDER_COUNT) throw new Error('Duplicate order IDs')
  if (new Set(groups.map(g => g.id)).size !== groups.length) throw new Error('Duplicate group IDs')
  console.log({ scenario: SCENARIO, anchor: ANCHOR.toISOString(), buyers: BUYER_COUNT, orders: orders.length, sellerGroups: groups.length, fingerprint })
  if (process.env.SEED_DRY_RUN === '1') return
  if (process.env.SEED_ALLOW_RESET !== 'BICIMARKET_DEMO') throw new Error('Refusing reset: set SEED_ALLOW_RESET=BICIMARKET_DEMO')

  const prisma = new PrismaClient()
  try {
    await prisma.orderStatusHistory.deleteMany()
    await prisma.orderItem.deleteMany()
    await prisma.orderSellerGroup.deleteMany()
    await prisma.order.deleteMany()
    await prisma.favoriteItem.deleteMany()
    await prisma.cartItem.deleteMany()
    await prisma.cart.deleteMany()
    await prisma.buyerProfile.updateMany({ data: { defaultShippingAddressId: null } })
    await prisma.address.deleteMany()
    await prisma.buyerProfile.deleteMany()

    const firstOrderByBuyer = new Map<number, Date>()
    for (const order of orders) if (!firstOrderByBuyer.has(order.buyer)) firstOrderByBuyer.set(order.buyer, order.createdAt)
    const profiles = Array.from({ length: BUYER_COUNT }, (_, i) => {
      const n = i + 1; const postal = postalForBuyer(n); const firstOrder = firstOrderByBuyer.get(n)
      const createdAt = firstOrder ? addDays(firstOrder, -(7 + int(`buyer-lead:${n}`, 84))) : addDays(ANCHOR, -(1 + int(`prospect-age:${n}`, 180)))
      return { id: buyerId(n), clerkUserId: buyerClerkId(n), fullName: `Cliente Demo ${pad(n, 4)}`, email: `buyer.demo.${pad(n, 4)}@bicimarket.test`, phone: int(`phone-null:${n}`, 10) === 0 ? null : `+54911${pad(10_000_000 + n, 8)}`, createdAt, defaultShippingAddressId: null, deletedAt: null, _postal: postal }
    })
    await createManyBatched(prisma.buyerProfile, profiles.map(({ _postal, ...p }) => p))
    const addresses = profiles.flatMap((profile, i) => {
      const n = i + 1; const primary = address(profile._postal, n); const secondaryPostal = POSTALS[int(`secondary-postal:${n}`, POSTALS.length)]; const secondary = address(secondaryPostal, n + 10_000)
      return [
        { id: `adr_demo_${pad(n, 4)}_1`, buyerProfileId: profile.id, alias: 'Casa', ...primary, isDefault: true, createdAt: profile.createdAt },
        { id: `adr_demo_${pad(n, 4)}_2`, buyerProfileId: profile.id, alias: 'Trabajo', ...secondary, isDefault: false, createdAt: addDays(profile.createdAt, 1) },
      ]
    })
    await createManyBatched(prisma.address, addresses)
    for (let i = 0; i < profiles.length; i += 100) {
      await prisma.$transaction(profiles.slice(i, i + 100).map((p, offset) => prisma.buyerProfile.update({ where: { id: p.id }, data: { defaultShippingAddressId: `adr_demo_${pad(i + offset + 1, 4)}_1` } })))
    }

    const buyersWithOrders = new Set(orders.map(o => o.buyer))
    const carts = profiles.map((p, i) => ({ id: `crt_demo_${pad(i + 1, 4)}`, buyerProfileId: p.id, status: buyersWithOrders.has(i + 1) ? 'CONVERTED' : 'ACTIVE', createdAt: addDays(p.createdAt, 2) }))
    await createManyBatched(prisma.cart, carts as any[])
    const cartItems = profiles.flatMap((_, i) => Array.from({ length: 2 + int(`cart-count:${i + 1}`, 3) }, (_, j) => {
      const seller = 1 + ((int(`cart-seller:${i + 1}`, 32) + j * 7) % 32); const slot = 1 + ((int(`cart-product:${i + 1}`, 8) + j) % 8)
      return { id: `cit_demo_${pad(i + 1, 4)}_${j + 1}`, cartId: carts[i].id, productId: productId(seller, slot), sellerProfileId: sellerId(seller), quantity: 1 + int(`cart-qty:${i + 1}:${j}`, 2), addedAt: addDays(carts[i].createdAt, j) }
    }))
    await createManyBatched(prisma.cartItem, cartItems)
    const favorites = profiles.flatMap((_, i) => Array.from({ length: 4 }, (_, j) => {
      const seller = 1 + ((int(`fav-seller:${i + 1}`, SELLER_COUNT) + j * 11) % SELLER_COUNT); const slot = 1 + ((int(`fav-product:${i + 1}`, PRODUCTS_PER_SELLER) + j) % PRODUCTS_PER_SELLER)
      return { id: `fav_demo_${pad(i + 1, 4)}_${j + 1}`, buyerProfileId: buyerId(i + 1), productId: productId(seller, slot), addedAt: addDays(profiles[i].createdAt, 5 + j) }
    }))
    await createManyBatched(prisma.favoriteItem, favorites)

    await createManyBatched(prisma.order, orders.map(o => ({ id: o.id, buyerProfileId: buyerId(o.buyer), paymentId: paymentId(o.n), status: buyerOrderStatus(o), itemsTotalCents: o.itemsTotal, shippingTotalCents: o.shippingTotal, totalCents: o.total, currency: 'ARS', shippingAddressSnapshot: address(postalForBuyer(o.buyer), o.buyer), notes: int(`notes:${o.n}`, 12) === 0 ? 'Coordinar entrega por teléfono' : null, createdAt: o.createdAt, updatedAt: o.createdAt })) as any[])
    await createManyBatched(prisma.orderSellerGroup, orders.flatMap(o => o.groups.map(g => ({ id: g.id, orderId: o.id, sellerProfileId: sellerId(g.seller), itemsSubtotalCents: g.subtotal, shippingCostCents: g.shippingCost, shippingQuoteId: g.shipmentStatus ? g.quoteId : null, shipmentId: g.shipmentStatus ? g.shipmentId : null, trackingNumber: g.shipmentStatus ? `TRK-AR-${pad(o.n, 6)}-${pad(g.seller, 3)}` : null, trackingUrl: g.shipmentStatus ? `https://shipping.bicimarket.test/track/${g.shipmentId}` : null, weightGramsTotal: g.weight, status: sellerGroupStatus(o, g), shippingStatus: shippingStatus(g.shipmentStatus), createdAt: o.createdAt, updatedAt: o.createdAt }))) as any[])
    await createManyBatched(prisma.orderItem, orders.flatMap(o => o.groups.flatMap(g => g.items.map(item => ({ id: item.id, orderId: o.id, sellerGroupId: g.id, productId: item.productId, productNameSnapshot: item.name, unitPriceCents: item.price, quantity: item.quantity, weightGramsSnapshot: item.weight })))))
    const histories = orders.flatMap(o => {
      const flow = transitions(buyerOrderStatus(o)); const rows: any[] = []
      for (let i = 1; i < flow.length; i++) rows.push({ id: `osh_demo_${pad(o.n, 5)}_${i}`, orderId: o.id, fromStatus: flow[i - 1], toStatus: flow[i], source: 'system', payload: { scenario: SCENARIO }, occurredAt: minDate(addHours(o.createdAt, i * 18), addHours(ANCHOR, -1)) })
      return rows
    })
    await createManyBatched(prisma.orderStatusHistory, histories)

    const counts = { buyers: await prisma.buyerProfile.count(), orders: await prisma.order.count(), sellerGroups: await prisma.orderSellerGroup.count(), items: await prisma.orderItem.count() }
    console.log('Buyer seed complete', { ...counts, fingerprint })
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(error => { console.error('Buyer seed failed', error); process.exit(1) })

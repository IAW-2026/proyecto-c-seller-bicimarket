/** BiciMarket demo v3 - Shipping App seed. Copy to `prisma/seed.ts`. */
import { createHash } from 'node:crypto'
import { PrismaClient } from '../src/generated/prisma/client'

const SCENARIO = 'bicimarket-demo-v3'
const ORDER_COUNT = 2400
const BATCH_SIZE = Math.max(50, Number(process.env.SEED_BATCH_SIZE ?? 500))
type PaymentState = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded'
type ShipmentState = 'created' | 'ready_for_pickup' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed_delivery' | 'returned'
type Service = 'standard' | 'express' | 'same_day'
type Postal = { cp: string; lat: number; lng: number; city: string; province: string }
const POSTALS: Postal[] = [
  { cp: 'C1043', lat: -34.6037, lng: -58.4044, city: 'Almagro', province: 'Buenos Aires' }, { cp: 'C1406', lat: -34.6190, lng: -58.4427, city: 'Caballito', province: 'Buenos Aires' },
  { cp: 'C1425', lat: -34.5895, lng: -58.4222, city: 'Palermo', province: 'Buenos Aires' }, { cp: 'C1426', lat: -34.5810, lng: -58.4380, city: 'Palermo', province: 'Buenos Aires' },
  { cp: 'B1642', lat: -34.4690, lng: -58.5180, city: 'San Isidro', province: 'Buenos Aires' }, { cp: 'B1629', lat: -34.4580, lng: -58.9070, city: 'Pilar', province: 'Buenos Aires' },
  { cp: 'B1878', lat: -34.7170, lng: -58.2580, city: 'Quilmes', province: 'Buenos Aires' }, { cp: 'B1900', lat: -34.9214, lng: -57.9544, city: 'La Plata', province: 'Buenos Aires' },
  { cp: 'B8000', lat: -38.7196, lng: -62.2724, city: 'Bahía Blanca', province: 'Buenos Aires' }, { cp: 'B7600', lat: -38.0055, lng: -57.5426, city: 'Mar del Plata', province: 'Buenos Aires' },
  { cp: 'S2000', lat: -32.9587, lng: -60.6930, city: 'Rosario', province: 'Santa Fe' }, { cp: 'X5000', lat: -31.4201, lng: -64.1888, city: 'Córdoba', province: 'Córdoba' },
  { cp: 'M5500', lat: -32.8908, lng: -68.8272, city: 'Mendoza', province: 'Mendoza' }, { cp: 'T4000', lat: -26.8083, lng: -65.2176, city: 'San Miguel de Tucumán', province: 'Tucumán' },
  { cp: 'A4400', lat: -24.7821, lng: -65.4232, city: 'Salta', province: 'Salta' }, { cp: 'E3100', lat: -31.7333, lng: -60.5290, city: 'Paraná', province: 'Entre Ríos' },
  { cp: 'N3300', lat: -27.3621, lng: -55.9007, city: 'Posadas', province: 'Misiones' }, { cp: 'Q8300', lat: -38.9516, lng: -68.0591, city: 'Neuquén', province: 'Neuquén' },
  { cp: 'R8400', lat: -41.1335, lng: -71.3103, city: 'San Carlos de Bariloche', province: 'Río Negro' }, { cp: 'U9000', lat: -45.8651, lng: -67.4980, city: 'Comodoro Rivadavia', province: 'Chubut' },
]
const CATALOG = [
  { price: 82_000_000, step: 3_100_000, weight: 13_200, weightStep: 180, products: 'Trek Marlin 5|Specialized Rockhopper|Venzo Raptor|Vairo XR 3.0|Scott Aspect 930|Cannondale Trail 5|Giant Talon 1|Merida Big Nine 300|GT Avalanche Comp|Zenith Cima 29'.split('|') },
  { price: 96_000_000, step: 4_200_000, weight: 7_900, weightStep: 120, products: 'Venzo R35|Trek Domane AL 2|Specialized Allez|Giant Contend AR|Cannondale CAAD13|Scott Speedster 20|Merida Scultura 400|Bianchi Via Nirone|Orbea Avant H40|Wilier GTR Team'.split('|') },
  { price: 52_000_000, step: 2_300_000, weight: 11_500, weightStep: 190, products: 'Raleigh Classic Urban|Raleigh P20 Folding|Olmo Amsterdam|Vairo Metro 1.0|Giant Escape 3|Trek FX 1|Specialized Sirrus 2.0|Cannondale Quick 5|Volta E-Bike City|Aurora Classic 26'.split('|') },
  { price: 31_000_000, step: 1_700_000, weight: 7_800, weightStep: 210, products: 'Firebird Explorer 12|Firebird Explorer 16|Firebird Explorer 20|Vairo Kids 16|Vairo Kids 20|Trek Precaliber 16|Trek Precaliber 20|Specialized Jett 20|Giant XTC Jr 20|Cannondale Kids Trail 20'.split('|') },
  { price: 48_000_000, step: 2_600_000, weight: 10_500, weightStep: 150, products: 'GT Performer 20|Sunday Primer|WeThePeople Arcade|Mongoose Legion L20|Mongoose Legion L40|Haro Downtown|Fit PRK|Cult Gateway|Kink Curb|Subrosa Tiro'.split('|') },
  { price: 5_500_000, step: 1_350_000, weight: 420, weightStep: 210, products: 'Shimano Deore M6100 Cassette|Shimano SLX M7100 Derailleur|Shimano XT M8100 Crankset|Shimano MT200 Brakes|SRAM GX Eagle Cassette|Fox 36 Float Factory|Continental Race King 29|Fizik Antares R1|DT Swiss M1900 Wheelset|Shimano PD-M520 Pedals'.split('|') },
  { price: 2_800_000, step: 850_000, weight: 250, weightStep: 170, products: 'Specialized Align II MIPS Helmet|Abus Bordo 6000 Lock|Lezyne Macro Drive 1200 Light|CamelBak MULE Backpack|Topeak JoeBlow Pump|Garmin Edge 530 Computer|Thule ProRide Rack|Fidlock Twist Bottle|Topeak Wedge Saddle Bag|Park Tool PCS-10 Stand'.split('|') },
  { price: 3_200_000, step: 720_000, weight: 180, weightStep: 55, products: 'Fox Ranger Jersey|Fox Ranger Shorts|Castelli Rosso Corsa Bib|Castelli Perfetto Jacket|Giro Bravo Gel Gloves|Shimano XC501 Shoes|Shimano RC502 Shoes|Oakley Sutro Glasses|Craft Active Base Layer|Endura Hummvee Pants'.split('|') },
] as const
function listingProduct(seller: number, slot: number) { const category = CATALOG[slot - 1], baseIndex = ((seller - 1) + (slot - 1) * 3) % 10, title = category.products[baseIndex].replace('Giant XTC Jr 20', 'Giant XTC Junior 20'); return { title, price: category.price + baseIndex * category.step + seller * 125_000, weight: category.weight + baseIndex * category.weightStep } }
function hash(text: string): number { let v = 2166136261; for (let i = 0; i < text.length; i++) { v ^= text.charCodeAt(i); v = Math.imul(v, 16777619) } return v >>> 0 }
function int(key: string, max: number): number { return hash(`${SCENARIO}:${key}`) % max }
function pad(n: number, size: number): string { return String(n).padStart(size, '0') }
function addDays(d: Date, n: number): Date { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x }
function addHours(d: Date, n: number): Date { const x = new Date(d); x.setUTCHours(x.getUTCHours() + n); return x }
function minDate(a: Date, b: Date): Date { return a < b ? a : b }
function requireAnchor(): Date { const raw = process.env.SEED_ANCHOR_DATE; if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new Error('SEED_ANCHOR_DATE=YYYY-MM-DD is required'); const d = new Date(`${raw}T00:00:00Z`); if (Number.isNaN(d.getTime())) throw new Error('Invalid SEED_ANCHOR_DATE'); return d }
const ANCHOR = requireAnchor(); const START = addDays(ANCHOR, -730)
const buyerId = (n: number) => `byp_demo_${pad(n, 4)}`; const sellerId = (n: number) => `slp_demo_${pad(n, 3)}`
const productId = (s: number, p: number) => `prd_demo_${pad(s, 3)}_${pad(p, 2)}`; const orderId = (n: number) => `ord_demo_${pad(n, 5)}`; const paymentId = (n: number) => `pay_demo_${pad(n, 5)}`
const groupId = (o: number, s: number) => `osg_demo_${pad(o, 5)}_${pad(s, 3)}`; const salesOrderId = (o: number, s: number) => `sor_demo_${pad(o, 5)}_${pad(s, 3)}`
const quoteId = (o: number, s: number) => `qte_demo_${pad(o, 5)}_${pad(s, 3)}`; const shipmentId = (o: number, s: number) => `shp_demo_${pad(o, 5)}_${pad(s, 3)}`
function buyerAssignments(): number[] { const r = Array<number>(ORDER_COUNT + 1).fill(0), used = new Set<number>(); for (let k = 0; k < 130; k++) { const p = Math.floor((k + .5) * 2055 / 130) + 1; used.add(p); r[p] = 51 + k } for (let k = 0; k < 120; k++) { const p = 2056 + Math.floor((k + .5) * 345 / 120); used.add(p); r[p] = 181 + k } const recent = Array.from({ length: 345 }, (_, i) => 2056 + i).filter(i => !used.has(i)); for (let n = 0; n < 200; n++) { const s = int(`recent-repeat-slot:${n}`, recent.length), p = recent.splice(s, 1)[0]; used.add(p); r[p] = 301 + n } const a = Array.from({ length: ORDER_COUNT }, (_, i) => i + 1).filter(i => !used.has(i)); for (let n = 0; n < 200; n++) { const s = int(`repeat-slot:${n}`, a.length); r[a.splice(s, 1)[0]] = 301 + n } for (const p of a) r[p] = 301 + int(`buyer:${p}`, 200); return r }
const BUYER_BY_ORDER = buyerAssignments()
function orderDate(n: number): Date { const day = n <= 1000 ? Math.floor((n - 1) * 365 / 1000) : 365 + Math.floor((n - 1001) * 365 / 1400); const d = addDays(START, day); d.setUTCHours(8 + int(`hour:${n}`, 14), int(`minute:${n}`, 60)); return d }
function paymentState(n: number): PaymentState { const b = n * 37 % 100; return b < 92 ? 'approved' : b < 95 ? 'rejected' : b < 97 ? 'pending' : b < 99 ? 'cancelled' : 'refunded' }
function groupCount(n: number): number { const r = int(`groups:${n}`, 100); return r < 72 ? 1 : r < 95 ? 2 : 3 }
function buyerPostal(n: number): Postal { const pool = int(`buyer-zone:${n}`, 100) < 55 ? POSTALS.slice(0, 8) : POSTALS; return pool[int(`buyer-postal:${n}`, pool.length)] }
function sellerPostal(n: number): Postal { return POSTALS[n * 7 % POSTALS.length] }
function distance(a: Postal, b: Postal): number { const rad = (v: number) => v * Math.PI / 180, la = rad(b.lat - a.lat), lo = rad(b.lng - a.lng), q = Math.sin(la / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(lo / 2) ** 2; return Math.round(12742 * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q))) }
function shipmentState(n: number, g: number, state: PaymentState, age: number): ShipmentState | null { if (state === 'pending' || state === 'rejected' || state === 'cancelled') return null; const r = int(`shipment-state:${n}:${g}`, 100); if (state === 'refunded') return r < 25 ? null : r < 62 ? 'returned' : 'failed_delivery'; if (age <= 2) return r < 30 ? null : r < 55 ? 'created' : r < 80 ? 'ready_for_pickup' : r < 95 ? 'picked_up' : 'in_transit'; if (age <= 5) return r < 10 ? 'created' : r < 30 ? 'ready_for_pickup' : r < 55 ? 'picked_up' : r < 85 ? 'in_transit' : r < 95 ? 'out_for_delivery' : 'delivered'; if (age <= 9) return r < 5 ? 'ready_for_pickup' : r < 15 ? 'picked_up' : r < 40 ? 'in_transit' : r < 65 ? 'out_for_delivery' : r < 95 ? 'delivered' : r < 98 ? 'failed_delivery' : 'returned'; return r < 82 ? 'delivered' : r < 86 ? 'in_transit' : r < 89 ? 'out_for_delivery' : r < 92 ? 'ready_for_pickup' : r < 94 ? 'picked_up' : r < 97 ? 'failed_delivery' : r < 99 ? 'returned' : 'created' }
type Item = { productId: string; name?: string; price: number; quantity: number; weight: number }
type Group = { seller: number; id: string; salesOrderId: string; quoteId: string; shipmentId: string; items: Item[]; subtotal: number; weight: number; shippingCost: number; service: Service; distance: number; shipmentStatus: ShipmentState | null; shipmentCreatedAt: Date | null; deliveredAt: Date | null }
type Order = { n: number; id: string; buyer: number; createdAt: Date; payment: PaymentState; groups: Group[] }
function address(p: Postal, n: number) { const streets = ['Av. San Martín', 'Belgrano', 'Mitre', 'Sarmiento', 'Av. Rivadavia', '9 de Julio']; return { street: streets[int(`street:${n}`, streets.length)], number: String(100 + int(`number:${n}`, 8900)), city: p.city, province: p.province, postalCode: p.cp, country: 'AR' } }
function makeOrder(n: number): Order {
  const buyer = BUYER_BY_ORDER[n], createdAt = orderDate(n), payment = paymentState(n), groups: Group[] = [], used = new Set<number>()
  for (let g = 0; g < groupCount(n); g++) {
    let seller = 1 + (int(`seller:${n}`, 32) + g * 11) % 32
    while (used.has(seller)) seller = seller % 32 + 1
    used.add(seller)
    const items: Item[] = [], slots = new Set<number>(), count = 1 + int(`item-count:${n}:${g}`, 3)
    for (let j = 0; j < count; j++) {
      let slot = 1 + ((int(`item-slot:${n}:${g}`, 8) + j * 3) % 8)
      while (slots.has(slot)) slot = slot % 8 + 1
      slots.add(slot)
      const p = listingProduct(seller, slot)
      items.push({ productId: productId(seller, slot), name: p.title, price: p.price, quantity: int(`quantity:${n}:${g}:${j}`, 100) < 18 ? 2 : 1, weight: p.weight })
    }
    const subtotal = items.reduce((s, x) => s + x.price * x.quantity, 0), weight = items.reduce((s, x) => s + x.weight * x.quantity, 0), km = distance(sellerPostal(seller), buyerPostal(buyer))
    const service: Service = km <= 50 && int(`service:${n}:${g}`, 100) < 25 ? 'same_day' : km <= 700 && int(`service:${n}:${g}`, 100) < 45 ? 'express' : 'standard'
    const base = service === 'same_day' ? 3_000_000 : service === 'express' ? 1_500_000 : 800_000, shippingCost = base + Math.min(km, 5000) * 1000 + Math.ceil(weight / 1000) * 20_000
    const age = Math.floor((ANCHOR.getTime() - createdAt.getTime()) / 86_400_000)
    let status = shipmentState(n, g, payment, age)
    const shipped = status ? minDate(addDays(createdAt, 1 + int(`ship-delay:${n}:${g}`, 3)), addHours(ANCHOR, -1)) : null, eta = service === 'same_day' ? 1 : service === 'express' ? 3 : 6
    let delivered = status === 'delivered' && shipped ? addDays(shipped, 1 + int(`delivery-days:${n}:${g}`, eta)) : null
    if (delivered && delivered >= ANCHOR) { delivered = null; status = 'out_for_delivery' }
    groups.push({ seller, id: groupId(n, seller), salesOrderId: salesOrderId(n, seller), quoteId: quoteId(n, seller), shipmentId: shipmentId(n, seller), items, subtotal, weight, shippingCost, service, distance: km, shipmentStatus: status, shipmentCreatedAt: shipped, deliveredAt: delivered })
  }
  return { n, id: orderId(n), buyer, createdAt, payment, groups }
}
const STAGES: ShipmentState[] = ['created', 'ready_for_pickup', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered']
function groupStatus(statuses: ShipmentState[]): ShipmentState { if (statuses.some(s => s === 'returned')) return 'returned'; if (statuses.some(s => s === 'failed_delivery')) return 'failed_delivery'; if (statuses.every(s => s === 'delivered')) return 'delivered'; return statuses.reduce((lowest, s) => STAGES.indexOf(s) < STAGES.indexOf(lowest) ? s : lowest, statuses[0]) }
function flow(status: ShipmentState): ShipmentState[] { if (status === 'returned') return ['created', 'ready_for_pickup', 'picked_up', 'in_transit', 'failed_delivery', 'returned']; if (status === 'failed_delivery') return ['created', 'ready_for_pickup', 'picked_up', 'in_transit', 'out_for_delivery', 'failed_delivery']; return STAGES.slice(0, STAGES.indexOf(status) + 1) }
async function createMany(model: { createMany(args: any): Promise<any> }, data: any[]) { for (let i = 0; i < data.length; i += BATCH_SIZE) await model.createMany({ data: data.slice(i, i + BATCH_SIZE) }) }
function fingerprint(orders: Order[]): string { const canonical = orders.flatMap(o => [o.id, buyerId(o.buyer), paymentId(o.n), o.payment, ...o.groups.flatMap(g => [g.id, g.salesOrderId, g.quoteId, g.shipmentId, String(g.subtotal), String(g.shippingCost), String(g.shipmentStatus), ...g.items.map(i => i.productId)])]).join('|'); return createHash('sha256').update(canonical).digest('hex') }

async function main() {
  const orders = Array.from({ length: ORDER_COUNT }, (_, i) => makeOrder(i + 1)), fp = fingerprint(orders)
  const shippable = orders.map(order => ({ order, groups: order.groups.filter(g => g.shipmentStatus && g.shipmentCreatedAt) })).filter(x => x.groups.length)
  const shipments = shippable.flatMap(x => x.groups.map(group => ({ order: x.order, group })))
  console.log({ scenario: SCENARIO, anchor: ANCHOR.toISOString(), shipmentGroups: shippable.length, shipments: shipments.length, fingerprint: fp })
  if (process.env.SEED_DRY_RUN === '1') return
  if (process.env.SEED_ALLOW_RESET !== 'BICIMARKET_DEMO') throw new Error('Refusing reset: set SEED_ALLOW_RESET=BICIMARKET_DEMO')
  const prisma = new PrismaClient()
  try {
    await prisma.deliveryProof.deleteMany(); await prisma.trackingEvent.deleteMany(); await prisma.shipmentStatusHistory.deleteMany(); await prisma.package.deleteMany(); await prisma.deliveryAssignment.deleteMany(); await prisma.shipment.deleteMany(); await prisma.shipmentGroup.deleteMany(); await prisma.shippingQuote.deleteMany(); await prisma.shippingRate.deleteMany(); await prisma.logisticsOperator.deleteMany()
    const operators = Array.from({ length: 24 }, (_, i) => { const n = i + 1; return { id: `lop_demo_${pad(n, 3)}`, clerkUserId: `user_logistics_demo_${pad(n, 3)}`, fullName: `Operador Logístico ${pad(n, 2)}`, email: `operador.${pad(n, 2)}@bicimarket.test`, phone: `+54911${pad(20_000_000 + n, 8)}`, documentId: String(30_000_000 + n), vehicleType: n % 7 === 0 ? 'truck' : n % 3 === 0 ? 'motorcycle' : n % 2 === 0 ? 'car' : 'van', licensePlate: `BM${pad(n, 3)}AR`, status: n <= 20 ? 'active' : n <= 22 ? 'inactive' : 'suspended', createdAt: addDays(START, -240 + i * 7), deletedAt: null } })
    await createMany(prisma.logisticsOperator, operators as any[])
    const distances = [[0, 15], [15, 80], [80, 400], [400, 1500], [1500, 5000]], weights = [[0, 500], [500, 1000], [1000, 3000], [3000, 5000], [5000, 8000], [8000, 12000], [12000, 15000], [15000, 20000], [20000, 30000], [30000, 50000]], services: Service[] = ['standard', 'express', 'same_day']; let rate = 0; const rates: any[] = []
    for (const d of distances) for (const w of weights) for (const service of services) { rate++; const base = service === 'same_day' ? 3_000_000 : service === 'express' ? 1_500_000 : 800_000; rates.push({ id: `rat_demo_${pad(rate, 3)}`, carrier: service === 'same_day' ? 'propio' : service === 'express' ? 'oca' : 'andreani', serviceLevel: service, distanceKmMin: d[0], distanceKmMax: d[1], weightGramsMin: w[0], weightGramsMax: w[1], costCents: base + d[1] * 1000 + Math.ceil(w[1] / 1000) * 20_000, estimatedDaysMin: service === 'same_day' ? 0 : service === 'express' ? 1 : 2, estimatedDaysMax: service === 'same_day' ? 1 : service === 'express' ? 3 : 6 + Math.floor(d[1] / 1000), active: !(service === 'same_day' && d[0] >= 80) }) }
    await createMany(prisma.shippingRate, rates)
    await createMany(prisma.shippingQuote, shipments.map(({ order, group }) => { const count = group.weight > 18_000 ? 2 : 1; return { id: group.quoteId, sellerProfileId: sellerId(group.seller), fromAddressSnapshot: address(sellerPostal(group.seller), 50_000 + group.seller), toAddressSnapshot: address(buyerPostal(order.buyer), order.buyer), serviceLevel: group.service, carrier: group.service === 'same_day' ? 'propio' : group.service === 'express' ? 'oca' : 'andreani', costCents: group.shippingCost, currency: 'ARS', weightGramsTotal: group.weight, packagesCount: count, packagesSnapshot: Array.from({ length: count }, () => ({ weightGrams: Math.ceil(group.weight / count), lengthCm: group.weight > 8000 ? 180 : 50, widthCm: group.weight > 8000 ? 60 : 35, heightCm: group.weight > 8000 ? 110 : 30 })), estimatedDaysMin: group.service === 'same_day' ? 0 : group.service === 'express' ? 1 : 2, estimatedDaysMax: group.service === 'same_day' ? 1 : group.service === 'express' ? 3 : 6 + Math.floor(group.distance / 1000), idempotencyKey: `seed:${SCENARIO}:quote:${order.n}:${group.seller}`, expiresAt: order.createdAt, createdAt: addHours(order.createdAt, -1) } }))
    await createMany(prisma.shipmentGroup, shippable.map(({ order, groups }) => { const status = groupStatus(groups.map(g => g.shipmentStatus!)), operator = 1 + int(`operator:${order.n}`, 20); return { id: `grp_demo_${pad(order.n, 5)}`, orderId: order.id, buyerProfileId: buyerId(order.buyer), trackingNumber: `BMK-${pad(order.n, 7)}`, status, serviceLevel: groups.some(g => g.service === 'same_day') ? 'same_day' : groups.some(g => g.service === 'express') ? 'express' : 'standard', shippingAddressSnapshot: address(buyerPostal(order.buyer), order.buyer), originsCount: groups.length, assignedOperatorClerkUserId: `user_logistics_demo_${pad(operator, 3)}`, createdAt: minDate(addHours(order.createdAt, 24), addHours(ANCHOR, -1)) } }))
    await createMany(prisma.shipment, shipments.map(({ order, group }) => ({ id: group.shipmentId, orderId: order.id, orderSellerGroupId: group.id, salesOrderId: group.salesOrderId, sellerProfileId: sellerId(group.seller), buyerProfileId: buyerId(order.buyer), shipmentGroupId: `grp_demo_${pad(order.n, 5)}`, shippingQuoteId: group.quoteId, carrier: group.service === 'same_day' ? 'propio' : group.service === 'express' ? 'oca' : 'andreani', serviceLevel: group.service, trackingNumber: `TRK-AR-${pad(order.n, 6)}-${pad(group.seller, 3)}`, labelUrl: `https://shipping.bicimarket.test/labels/${group.shipmentId}.pdf`, status: group.shipmentStatus, weightGramsTotal: group.weight, costCents: group.shippingCost, currency: 'ARS', shippingAddressSnapshot: address(buyerPostal(order.buyer), order.buyer), pickupAddressSnapshot: address(sellerPostal(group.seller), 50_000 + group.seller), idempotencyKey: `seed:${SCENARIO}:shipment:${order.n}:${group.seller}`, shippedAt: group.shipmentStatus && !['created', 'ready_for_pickup'].includes(group.shipmentStatus) ? addHours(group.shipmentCreatedAt!, 24) : null, deliveredAt: group.deliveredAt, createdAt: group.shipmentCreatedAt })))
    const packages = shipments.flatMap(({ group }) => { const count = group.weight > 18_000 ? 2 : 1; return Array.from({ length: count }, (_, i) => ({ id: `pkg_${group.shipmentId}_${i + 1}`, shipmentId: group.shipmentId, weightGrams: Math.ceil(group.weight / count), lengthCm: group.weight > 8000 ? 180 : 50, widthCm: group.weight > 8000 ? 60 : 35, heightCm: group.weight > 8000 ? 110 : 30, description: i ? 'Paquete complementario' : 'Paquete principal', labelUrl: `https://shipping.bicimarket.test/labels/${group.shipmentId}-${i + 1}.pdf`, createdAt: group.shipmentCreatedAt } as any)) })
    await createMany(prisma.package, packages)
    const eventRows: any[] = [], historyRows: any[] = []
    for (const { order, group } of shipments) { const states = flow(group.shipmentStatus!), base = group.shipmentCreatedAt!; states.forEach((state, i) => { const at = state === 'delivered' && group.deliveredAt ? group.deliveredAt : minDate(addHours(base, [0, 4, 24, 40, 64, 88][Math.min(i, 5)]), addHours(ANCHOR, -1)); eventRows.push({ id: `evt_demo_${pad(order.n, 5)}_${pad(group.seller, 3)}_${i + 1}`, shipmentId: group.shipmentId, eventType: state, location: state === 'created' ? sellerPostal(group.seller).city : buyerPostal(order.buyer).city, note: `Evento ${state} generado por ${SCENARIO}`, occurredAt: at, createdAt: at }); if (i > 0) historyRows.push({ id: `ssh_demo_${pad(order.n, 5)}_${pad(group.seller, 3)}_${i}`, shipmentId: group.shipmentId, fromStatus: states[i - 1], toStatus: state, source: 'system', payload: { scenario: SCENARIO }, occurredAt: at, createdAt: at }) }) }
    await createMany(prisma.trackingEvent, eventRows); await createMany(prisma.shipmentStatusHistory, historyRows)
    await createMany(prisma.deliveryAssignment, shippable.map(({ order, groups }) => { const operator = 1 + int(`operator:${order.n}`, 20), status = groupStatus(groups.map(g => g.shipmentStatus!)); return { id: `dla_demo_${pad(order.n, 5)}`, shipmentGroupId: `grp_demo_${pad(order.n, 5)}`, shipmentId: null, operatorClerkUserId: `user_logistics_demo_${pad(operator, 3)}`, status: status === 'delivered' ? 'delivered' : ['picked_up', 'in_transit', 'out_for_delivery', 'failed_delivery', 'returned'].includes(status) ? 'picked_up' : 'accepted', assignedAt: minDate(addHours(order.createdAt, 26), addHours(ANCHOR, -1)), completedAt: status === 'delivered' ? groups.map(g => g.deliveredAt).filter(Boolean).sort((a, b) => a!.getTime() - b!.getTime()).at(-1) : null, createdAt: minDate(addHours(order.createdAt, 26), addHours(ANCHOR, -1)) } }))
    await createMany(prisma.deliveryProof, shipments.filter(x => x.group.deliveredAt).map(({ order, group }) => ({ id: `prf_demo_${pad(order.n, 5)}_${pad(group.seller, 3)}`, shipmentId: group.shipmentId, proofPhotoUrl: int(`proof-photo:${order.n}:${group.seller}`, 10) ? `https://shipping.bicimarket.test/proofs/${group.shipmentId}.jpg` : null, signatureImageUrl: `https://shipping.bicimarket.test/proofs/${group.shipmentId}-signature.png`, note: 'Entrega verificada', deliveredAt: group.deliveredAt, createdAt: group.deliveredAt })))
    console.log('Shipping seed complete', { groups: await prisma.shipmentGroup.count(), shipments: await prisma.shipment.count(), events: await prisma.trackingEvent.count(), fingerprint: fp })
  } finally { await prisma.$disconnect() }
}
main().catch(error => { console.error('Shipping seed failed', error); process.exit(1) })

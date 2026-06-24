
/** BiciMarket demo v3 - Seller App seed. Copy to `prisma/seed.ts`. */
import { createHash } from 'node:crypto'
import { PrismaClient } from '@prisma/client'

const SCENARIO = 'bicimarket-demo-v3'
const ORDER_COUNT = 2400
const BUYER_COUNT = 500
const SELLER_COUNT = 40
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

const PRODUCT_IMAGE_FILES: Record<string, readonly string[]> = {
  'accessories/abus-bordo-6000-lock': ['1.webp', '2.webp'],
  'accessories/camelbak-mule-backpack': ['1.webp', '2.webp'],
  'accessories/fidlock-twist-bottle': ['1.webp', '2.webp'],
  'accessories/garmin-edge-530-computer': ['1.webp', '2.webp', '3.webp'],
  'accessories/lezyne-macro-drive-1200-light': ['1.webp', '2.webp', '3.webp'],
  'accessories/park-tool-pcs-10-stand': ['1.webp', '2.webp', '3.webp'],
  'accessories/specialized-align-ii-mips-helmet': ['1.webp', '2.webp', '3.webp'],
  'accessories/thule-pro-ride-rack': ['1.webp', '2.webp', '3.webp'],
  'accessories/topeak-joe-blow-pump': ['1.webp', '2.webp', '3.webp'],
  'accessories/topeak-wedge-saddle-bag': ['1.webp', '2.webp', '3.webp'],
  'bmx/cult-gateway': ['1.webp', '2.webp'],
  'bmx/fit-prk': ['1.webp', '2.webp'],
  'bmx/gt-performer-20': ['1.webp', '2.webp', '3.webp'],
  'bmx/haro-downtown': ['1.webp', '2.webp', '3.webp'],
  'bmx/kink-curb': ['1.webp', '2.webp', '3.webp'],
  'bmx/mongoose-legion-l20': ['1.webp', '2.webp', '3.webp'],
  'bmx/mongoose-legion-l40': ['1.webp', '2.webp', '3.webp'],
  'bmx/subrosa-tiro': ['1.webp', '2.webp', '3.webp'],
  'bmx/sunday-primer': ['1.webp', '2.webp', '3.webp'],
  'bmx/wethepeople-arcade': ['1.webp', '2.webp'],
  'indumentaria/castelli-perfetto-jacket': ['1.webp', '2.webp', '3.webp'],
  'indumentaria/castelli-rosso-corsa-bib': ['1.webp', '2.webp', '3.webp'],
  'indumentaria/craft-active-base-layer': ['1.webp', '2.webp', '3.webp'],
  'indumentaria/endura-hummvee-pants': ['1.webp', '2.webp', '3.webp'],
  'indumentaria/fox-ranger-jersey': ['1.webp', '2.webp', '3.webp'],
  'indumentaria/fox-ranger-shorts': ['1.webp', '2.webp', '3.webp'],
  'indumentaria/giro-bravo-gel-gloves': ['1.webp', '2.webp', '3.webp'],
  'indumentaria/oakley-sutro-glasses': ['1.webp', '2.webp', '3.webp'],
  'indumentaria/shimano-rc502-shoes': ['1.webp', '2.webp', '3.webp'],
  'indumentaria/shimano-xc501-shoes': ['1.webp', '2.webp', '3.webp'],
  'kids/cannondale-kids-trail-20': ['1.webp', '2.webp', '3.webp'],
  'kids/firebird-explorer-12': ['1.webp', '2.webp'],
  'kids/firebird-explorer-16': ['1.webp', '2.webp', '3.webp', '4.webp'],
  'kids/firebird-explorer-20': ['1.webp', '2.webp'],
  'kids/giant-xtc-jr-20': ['1.webp', '2.webp'],
  'kids/specialized-jett-20': ['1.webp', '2.webp'],
  'kids/trek-precaliber-16': ['1.webp', '2.webp', '3.webp'],
  'kids/trek-precaliber-20': ['1.webp', '2.webp', '3.webp'],
  'kids/vairo-kids-16': ['1.webp', '2.webp'],
  'kids/vairo-kids-20': ['1.webp', '2.webp'],
  'mtb/cannondale-trail-5': ['1.webp', '2.webp'],
  'mtb/giant-talon-1': ['1.webp', '2.webp', '3.webp', '4.webp'],
  'mtb/gt-avalanche-comp': ['1.webp', '2.webp', '3.webp'],
  'mtb/merida-big-nine-300': ['1.webp', '2.webp', '3.webp'],
  'mtb/scott-aspect-930': ['1.webp', '2.webp', '3.webp'],
  'mtb/specialized-rockhopper': ['1.webp', '2.webp', '3.webp', '4.webp'],
  'mtb/trek-marlin-5': ['1.webp', '2.webp', '3.webp', '4.webp'],
  'mtb/vairo-xr-3-0': ['1.webp', '2.webp', '3.webp', '4.webp'],
  'mtb/venzo-raptor': ['1.webp'],
  'mtb/zenith-cima-29': ['1.webp', '2.webp', '3.webp'],
  'parts/continental-race-king-29': ['1.webp', '2.webp', '3.webp'],
  'parts/dt-swiss-m1900-wheelset': ['1.webp', '2.webp', '3.webp'],
  'parts/fizik-antares-r1': ['1.webp', '2.webp', '3.webp'],
  'parts/fox-36-float-factory': ['1.webp', '2.webp', '3.webp', '4.webp'],
  'parts/shimano-deore-m6100-cassette': ['1.webp', '2.webp', '3.webp'],
  'parts/shimano-mt200-brakes': ['1.webp', '2.webp', '3.webp'],
  'parts/shimano-pd-m520-pedals': ['1.webp', '2.webp', '3.webp'],
  'parts/shimano-slx-m7100-derailleur': ['1.webp', '2.webp', '3.webp'],
  'parts/shimano-xt-m8100-crankset': ['1.webp', '2.webp', '3.webp'],
  'parts/sram-gx-eagle-cassette': ['1.webp', '2.webp', '3.webp'],
  'road/bianchi-via-nirone': ['1.webp', '2.webp'],
  'road/cannondale-caad13': ['1.jpg', '2.png'],
  'road/giant-contend-ar': ['1.jpg', '2.jpg', '3.jpg'],
  'road/merida-scultura-400': ['1.webp', '2.jpg', '3.jpg', '4.jpg'],
  'road/orbea-avant-h40': ['1.webp'],
  'road/scott-speedster-20': ['1.webp', '2.jpg', '3.jpg'],
  'road/specialized-allez': ['1.jpg', '2.jpg'],
  'road/trek-domane-al-2': ['1.webp', '2.webp', '3.webp'],
  'road/venzo-r35': ['1.webp', '2.webp'],
  'road/wilier-gtr-team': ['1.webp', '2.webp'],
  'urban/aurora-classic-26': ['1.webp', '2.webp', '3.webp'],
  'urban/cannondale-quick-5': ['1.webp', '2.webp', '3.webp'],
  'urban/giant-escape-3': ['1.webp', '2.webp', '3.webp', '4.webp'],
  'urban/olmo-amsterdam': ['1.webp', '2.webp', '3.webp'],
  'urban/raleigh-classic-urban': ['1.jpeg', '2.jpeg', '3.jpeg'],
  'urban/raleigh-p20-folding': ['1.webp', '2.webp', '3.webp'],
  'urban/specialized-sirrus-2-0': ['1.webp', '2.webp', '3.jpg'],
  'urban/trek-fx-1': ['1.webp'],
  'urban/vairo-metro-1-0': ['1.webp', '2.webp', '3.webp'],
  'urban/volta-e-bike-city': ['1.webp', '2.webp', '3.webp'],
}

function listingProduct(seller: number, slot: number) {
  const category = CATALOG[slot - 1]
  const baseIndex = ((seller - 1) + (slot - 1) * 3) % 10
  const [title, slug] = category.products.split('|')[baseIndex].split('~')
  const [brand, ...model] = title.split(' ')
  return { title, slug, brand, model: model.join(' '), category: category.category, price: category.price + baseIndex * category.step + seller * 125_000, weight: category.weight + baseIndex * category.weightStep, dims: category.dims }
}
const SELLER_NAMES = [
  'BiciSur', 'Rodados BA', 'Bikes MG', 'MTB Argentina', 'Urban Ride', 'JP Bikes', 'Acc Bici', 'Taller CD', 'Pedalear', 'Elena Cycles',
  'Ciclo Norte', 'Ruta 29', 'La Cadena', 'Viento Sur', 'Bike House', 'Rosario Pedalea', 'Córdoba Bike', 'Mendoza Ride', 'Patagonia Cycles', 'Pampa Bici',
  'Tucumán Rodados', 'Salta Trail', 'Litoral Bikes', 'Neuquén MTB', 'Bahía Rodados', 'Costa Pedal', 'Andes Cycling', 'Río Bike', 'BMX Federal', 'Bici Urbana',
  'Carbon Lab', 'Todo Shimano', 'Seller Histórico 1', 'Seller Histórico 2', 'Seller Histórico 3', 'Alta Pendiente', 'Ciclo Pendiente', 'Norte Pendiente', 'Sur Pendiente', 'Centro Pendiente',
]

function hash(text: string): number { let v = 2166136261; for (let i = 0; i < text.length; i++) { v ^= text.charCodeAt(i); v = Math.imul(v, 16777619) } return v >>> 0 }
function int(key: string, max: number): number { return hash(`${SCENARIO}:${key}`) % max }
function pad(n: number, size: number): string { return String(n).padStart(size, '0') }
function addDays(d: Date, n: number): Date { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x }
function addHours(d: Date, n: number): Date { const x = new Date(d); x.setUTCHours(x.getUTCHours() + n); return x }
function minDate(a: Date, b: Date): Date { return a < b ? a : b }
function requireAnchor(): Date { const raw = process.env.SEED_ANCHOR_DATE; if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new Error('SEED_ANCHOR_DATE=YYYY-MM-DD is required'); const d = new Date(`${raw}T00:00:00Z`); if (Number.isNaN(d.getTime())) throw new Error('Invalid SEED_ANCHOR_DATE'); return d }
const ANCHOR = requireAnchor(); const START = addDays(ANCHOR, -730)

const buyerId = (n: number) => `byp_demo_${pad(n, 4)}`
const buyerClerkId = (n: number) => `user_buyer_demo_${pad(n, 4)}`
const sellerId = (n: number) => `slp_demo_${pad(n, 3)}`
const productId = (s: number, slot: number) => `prd_demo_${pad(s, 3)}_${pad(slot, 2)}`
const orderId = (n: number) => `ord_demo_${pad(n, 5)}`
const paymentId = (n: number) => `pay_demo_${pad(n, 5)}`
const groupId = (o: number, s: number) => `osg_demo_${pad(o, 5)}_${pad(s, 3)}`
const salesOrderId = (o: number, s: number) => `sor_demo_${pad(o, 5)}_${pad(s, 3)}`
const quoteId = (o: number, s: number) => `qte_demo_${pad(o, 5)}_${pad(s, 3)}`
const shipmentId = (o: number, s: number) => `shp_demo_${pad(o, 5)}_${pad(s, 3)}`

function buyerAssignments(): number[] {
  const result = Array<number>(ORDER_COUNT + 1).fill(0); const used = new Set<number>()
  for (let k = 0; k < 130; k++) { const position = Math.floor(((k + 0.5) * 2055) / 130) + 1; used.add(position); result[position] = 51 + k }
  for (let k = 0; k < 120; k++) { const position = 2056 + Math.floor(((k + 0.5) * 345) / 120); used.add(position); result[position] = 181 + k }
  const recent = Array.from({ length: 345 }, (_, i) => 2056 + i).filter(i => !used.has(i))
  for (let n = 0; n < 200; n++) { const selected = int(`recent-repeat-slot:${n}`, recent.length), position = recent.splice(selected, 1)[0]; used.add(position); result[position] = 301 + n }
  const available = Array.from({ length: ORDER_COUNT }, (_, i) => i + 1).filter(i => !used.has(i))
  for (let n = 0; n < 200; n++) { const selected = int(`repeat-slot:${n}`, available.length); result[available.splice(selected, 1)[0]] = 301 + n }
  for (const position of available) result[position] = 301 + int(`buyer:${position}`, 200)
  return result
}
const BUYER_BY_ORDER = buyerAssignments()
function orderDate(n: number): Date { const day = n <= 1000 ? Math.floor(((n - 1) * 365) / 1000) : 365 + Math.floor(((n - 1001) * 365) / 1400); const d = addDays(START, day); d.setUTCHours(8 + int(`hour:${n}`, 14), int(`minute:${n}`, 60)); return d }
function paymentState(n: number): PaymentState { const b = (n * 37) % 100; return b < 92 ? 'approved' : b < 95 ? 'rejected' : b < 97 ? 'pending' : b < 99 ? 'cancelled' : 'refunded' }
function groupCount(n: number): number { const r = int(`groups:${n}`, 100); return r < 72 ? 1 : r < 95 ? 2 : 3 }
function buyerPostal(n: number): Postal { const pool = int(`buyer-zone:${n}`, 100) < 55 ? POSTALS.slice(0, 8) : POSTALS; return pool[int(`buyer-postal:${n}`, pool.length)] }
function sellerPostal(n: number): Postal { return POSTALS[(n * 7) % POSTALS.length] }
function distance(a: Postal, b: Postal): number { const rad = (v: number) => v * Math.PI / 180; const lat = rad(b.lat - a.lat); const lng = rad(b.lng - a.lng); const q = Math.sin(lat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(lng / 2) ** 2; return Math.round(6371 * 2 * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q))) }
function shipmentState(n: number, g: number, state: PaymentState, age: number): ShipmentState | null {
  if (state === 'pending' || state === 'rejected' || state === 'cancelled') return null
  const r = int(`shipment-state:${n}:${g}`, 100)
  if (state === 'refunded') return r < 25 ? null : r < 62 ? 'returned' : 'failed_delivery'
  if (age <= 2) return r < 30 ? null : r < 55 ? 'created' : r < 80 ? 'ready_for_pickup' : r < 95 ? 'picked_up' : 'in_transit'
  if (age <= 5) return r < 10 ? 'created' : r < 30 ? 'ready_for_pickup' : r < 55 ? 'picked_up' : r < 85 ? 'in_transit' : r < 95 ? 'out_for_delivery' : 'delivered'
  if (age <= 9) return r < 5 ? 'ready_for_pickup' : r < 15 ? 'picked_up' : r < 40 ? 'in_transit' : r < 65 ? 'out_for_delivery' : r < 95 ? 'delivered' : r < 98 ? 'failed_delivery' : 'returned'
  return r < 82 ? 'delivered' : r < 86 ? 'in_transit' : r < 89 ? 'out_for_delivery' : r < 92 ? 'ready_for_pickup' : r < 94 ? 'picked_up' : r < 97 ? 'failed_delivery' : r < 99 ? 'returned' : 'created'
}

type Item = { productId: string; name: string; price: number; quantity: number; weight: number }
type Group = { seller: number; id: string; salesOrderId: string; quoteId: string; shipmentId: string; items: Item[]; subtotal: number; weight: number; shippingCost: number; service: 'standard' | 'express' | 'same_day'; shipmentStatus: ShipmentState | null; shipmentCreatedAt: Date | null; deliveredAt: Date | null }
type Order = { n: number; id: string; buyer: number; createdAt: Date; payment: PaymentState; groups: Group[] }
function makeOrder(n: number): Order {
  const buyer = BUYER_BY_ORDER[n]; const createdAt = orderDate(n); const payment = paymentState(n); const groups: Group[] = []; const used = new Set<number>()
  for (let g = 0; g < groupCount(n); g++) {
    let seller = 1 + ((int(`seller:${n}`, 32) + g * 11) % 32); while (used.has(seller)) seller = seller % 32 + 1; used.add(seller)
    const items: Item[] = []; const slots = new Set<number>(); const count = 1 + int(`item-count:${n}:${g}`, 3)
    for (let j = 0; j < count; j++) { let slot = 1 + ((int(`item-slot:${n}:${g}`, 8) + j * 3) % 8); while (slots.has(slot)) slot = slot % 8 + 1; slots.add(slot); const p = listingProduct(seller, slot); items.push({ productId: productId(seller, slot), name: p.title, price: p.price, quantity: int(`quantity:${n}:${g}:${j}`, 100) < 18 ? 2 : 1, weight: p.weight }) }
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0); const weight = items.reduce((s, i) => s + i.weight * i.quantity, 0); const km = distance(sellerPostal(seller), buyerPostal(buyer)); const service = km <= 50 && int(`service:${n}:${g}`, 100) < 25 ? 'same_day' : km <= 700 && int(`service:${n}:${g}`, 100) < 45 ? 'express' : 'standard'; const base = service === 'same_day' ? 3_000_000 : service === 'express' ? 1_500_000 : 800_000; const shippingCost = base + Math.min(km, 5000) * 1000 + Math.ceil(weight / 1000) * 20_000
    const age = Math.floor((ANCHOR.getTime() - createdAt.getTime()) / 86_400_000); let status = shipmentState(n, g, payment, age); const shipped = status ? minDate(addDays(createdAt, 1 + int(`ship-delay:${n}:${g}`, 3)), addHours(ANCHOR, -1)) : null; const eta = service === 'same_day' ? 1 : service === 'express' ? 3 : 6; let delivered = status === 'delivered' && shipped ? addDays(shipped, 1 + int(`delivery-days:${n}:${g}`, eta)) : null; if (delivered && delivered >= ANCHOR) { delivered = null; status = 'out_for_delivery' }
    groups.push({ seller, id: groupId(n, seller), salesOrderId: salesOrderId(n, seller), quoteId: quoteId(n, seller), shipmentId: shipmentId(n, seller), items, subtotal, weight, shippingCost, service, shipmentStatus: status, shipmentCreatedAt: shipped, deliveredAt: delivered })
  }
  return { n, id: orderId(n), buyer, createdAt, payment, groups }
}
function settlementStatus(order: Order, group: Group): 'pending' | 'paid' | 'failed' | 'manual_review' | null {
  if (!group.deliveredAt) return null
  const age = Math.floor((ANCHOR.getTime() - group.deliveredAt.getTime()) / 86_400_000); const r = int(`settlement:${order.n}:${group.seller}`, 100)
  return age <= 7 ? (r < 55 ? 'paid' : r < 90 ? 'pending' : r < 95 ? 'failed' : 'manual_review') : (r < 78 ? 'paid' : r < 90 ? 'pending' : r < 95 ? 'failed' : 'manual_review')
}
function fulfillment(order: Order, group: Group): string {
  if (order.payment === 'refunded' && !group.shipmentStatus) return 'rejected'
  const s = group.shipmentStatus
  if (s === 'delivered') return 'delivered'
  if (s === 'created') return 'preparing'
  if (s === 'ready_for_pickup') return 'ready_to_ship'
  if (s) return 'handed_over'
  return int(`fulfillment:${order.n}:${group.seller}`, 2) ? 'accepted' : 'preparing'
}
function shippingStatus(s: ShipmentState | null): string { return s ?? 'pending' }
function address(p: Postal, n: number) { const streets = ['Av. San Martín', 'Belgrano', 'Mitre', 'Sarmiento', 'Av. Rivadavia', '9 de Julio']; return { street: streets[int(`street:${n}`, streets.length)], number: String(100 + int(`number:${n}`, 8900)), city: p.city, province: p.province, postalCode: p.cp, country: 'AR' } }
function historyFlow(status: string): string[] { if (status === 'rejected') return ['pending', 'rejected']; if (status === 'cancelled') return ['pending', 'accepted', 'cancelled']; const all = ['pending', 'accepted', 'preparing', 'ready_to_ship', 'handed_over', 'delivered']; return all.slice(0, all.indexOf(status) + 1) }
async function createMany(model: { createMany(args: any): Promise<any> }, data: any[]) { for (let i = 0; i < data.length; i += BATCH_SIZE) await model.createMany({ data: data.slice(i, i + BATCH_SIZE) }) }
function fingerprint(orders: Order[]): string { const canonical = orders.flatMap(o => [o.id, buyerId(o.buyer), paymentId(o.n), o.payment, ...o.groups.flatMap(g => [g.id, g.salesOrderId, g.quoteId, g.shipmentId, String(g.subtotal), String(g.shippingCost), String(g.shipmentStatus), ...g.items.map(i => i.productId)])]).join('|'); return createHash('sha256').update(canonical).digest('hex') }

async function main() {
  const orders = Array.from({ length: ORDER_COUNT }, (_, i) => makeOrder(i + 1)); const fp = fingerprint(orders); const eligible = orders.flatMap(o => o.groups.map(g => ({ order: o, group: g }))).filter(x => x.order.payment === 'approved' || x.order.payment === 'refunded')
  console.log({ scenario: SCENARIO, anchor: ANCHOR.toISOString(), sellers: SELLER_COUNT, products: SELLER_COUNT * 8, salesOrders: eligible.length, fingerprint: fp })
  if (process.env.SEED_DRY_RUN === '1') return
  if (process.env.SEED_ALLOW_RESET !== 'BICIMARKET_DEMO') throw new Error('Refusing reset: set SEED_ALLOW_RESET=BICIMARKET_DEMO')
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '')
  if (!supabaseUrl) throw new Error('SUPABASE_URL is required to build product image URLs')
  const imageBucket = process.env.PRODUCT_IMAGE_BUCKET ?? 'product-images'
  const imageBaseUrl = `${supabaseUrl}/storage/v1/object/public/${imageBucket}/catalog-v3`
  const prisma = new PrismaClient()
  try {
    await prisma.salesOrderStatusHistory.deleteMany(); await prisma.salesOrderItem.deleteMany(); await prisma.salesOrder.deleteMany(); await prisma.productImage.deleteMany(); await prisma.product.deleteMany(); await prisma.sellerProfile.deleteMany(); await prisma.user.deleteMany()
    const sellers = Array.from({ length: SELLER_COUNT }, (_, i) => { const n = i + 1; return { id: sellerId(n), clerkUserId: `user_seller_demo_${pad(n, 3)}`, legalName: `${SELLER_NAMES[i]} Demo ${n < 33 ? 'SRL' : 'SAS'}`, displayName: SELLER_NAMES[i], taxId: `30-${pad(70_000_000 + n, 8)}-${n % 10}`, taxCondition: n % 5 === 0 ? 'monotributo' : n % 7 === 0 ? 'consumidor_final' : 'responsable_inscripto', bankAccountReference: `mp_collector_demo_${pad(n, 3)}`, pickupAddress: address(sellerPostal(n), n), verificationStatus: n <= 32 ? 'verified' : n <= 35 ? 'suspended' : 'pending_review', createdAt: addDays(START, -365 + i * 7), deletedAt: null } })
    await createMany(prisma.sellerProfile, sellers as any[])
    await createMany(prisma.user, sellers.map((s, i) => ({ id: s.clerkUserId, email: `seller.demo.${pad(i + 1, 3)}@bicimarket.test`, firstName: s.displayName.split(' ')[0], lastName: s.displayName.split(' ').slice(1).join(' ') || 'Store', role: 'ADMIN', createdAt: s.createdAt })))
    const products = sellers.flatMap((seller, i) => CATALOG.map((_, slotIndex) => { const slot = slotIndex + 1, p = listingProduct(i + 1, slot), conditionRoll = int(`condition:${i + 1}:${slot}`, 100), statusRoll = int(`product-status:${i + 1}:${slot}`, 100); return { id: productId(i + 1, slot), sellerProfileId: seller.id, title: p.title, description: `${p.title} publicado por ${seller.displayName}. Ficha de demostración con precio y condición propios del seller.`, brand: p.brand, model: p.model, category: p.category, condition: conditionRoll < 70 ? 'new' : conditionRoll < 85 ? 'used_like_new' : conditionRoll < 95 ? 'used_good' : 'used_fair', priceCents: p.price, currency: 'ARS', weightGrams: p.weight, lengthCm: p.dims[0], widthCm: p.dims[1], heightCm: p.dims[2], status: statusRoll < 85 ? 'active' : statusRoll < 90 ? 'draft' : statusRoll < 95 ? 'paused' : 'archived', idempotencyKey: `seed:${SCENARIO}:product:${i + 1}:${slot}`, createdAt: addDays(seller.createdAt, slot), _slug: p.slug, _category: p.category } }))
    await createMany(prisma.product, products.map(({ _slug, _category, ...product }) => product) as any[])
    const productImages = products.flatMap((p, i) => {
      const inventoryKey = `${p._category}/${p._slug}`
      const files = PRODUCT_IMAGE_FILES[inventoryKey]
      if (!files) throw new Error(`Missing product image inventory: ${inventoryKey}`)
      return files.map((file, position) => ({ id: `img_demo_${pad(i + 1, 4)}_${position + 1}`, productId: p.id, url: `${imageBaseUrl}/${inventoryKey}/${file}`, position, idempotencyKey: `seed:${SCENARIO}:image:${p.id}:${position}` }))
    })
    await createMany(prisma.productImage, productImages)
    await createMany(prisma.salesOrder, eligible.map(({ order, group }) => ({ id: group.salesOrderId, orderId: order.id, orderSellerGroupId: group.id, sellerProfileId: sellerId(group.seller), buyerProfileId: buyerId(order.buyer), buyerClerkUserId: buyerClerkId(order.buyer), paymentId: paymentId(order.n), paymentStatus: order.payment === 'refunded' || group.shipmentStatus === 'returned' ? 'refunded' : settlementStatus(order, group) === 'paid' ? 'settled' : 'paid', fulfillmentStatus: fulfillment(order, group), shippingStatus: shippingStatus(group.shipmentStatus), shipmentId: group.shipmentStatus ? group.shipmentId : null, shippingQuoteId: group.shipmentStatus ? group.quoteId : null, itemsSubtotalCents: group.subtotal, shippingCostCents: group.shippingCost, totalCents: group.subtotal + group.shippingCost, currency: 'ARS', shippingAddressSnapshot: address(buyerPostal(order.buyer), order.buyer), idempotencyKey: `seed:${SCENARIO}:sales-order:${order.n}:${group.seller}`, createdAt: addHours(order.createdAt, 20), updatedAt: addHours(order.createdAt, 20) })) as any[])
    await createMany(prisma.salesOrderItem, eligible.flatMap(({ group }) => group.items.map((item, j) => ({ id: `soi_${group.salesOrderId}_${j + 1}`, salesOrderId: group.salesOrderId, productId: item.productId, productNameSnapshot: item.name, unitPriceCents: item.price, quantity: item.quantity }))))
    const histories = eligible.flatMap(({ order, group }) => { const flow = historyFlow(fulfillment(order, group)); return flow.slice(1).map((to, i) => ({ id: `soh_demo_${pad(order.n, 5)}_${pad(group.seller, 3)}_${i + 1}`, salesOrderId: group.salesOrderId, fromStatus: flow[i], toStatus: to, source: 'system', payload: { scenario: SCENARIO }, occurredAt: minDate(addHours(order.createdAt, 24 + (i + 1) * 18), addHours(ANCHOR, -1)) })) })
    await createMany(prisma.salesOrderStatusHistory, histories)
    console.log('Seller seed complete', { sellers: await prisma.sellerProfile.count(), products: await prisma.product.count(), productImages: await prisma.productImage.count(), salesOrders: await prisma.salesOrder.count(), fingerprint: fp })
  } finally { await prisma.$disconnect() }
}
main().catch(error => { console.error('Seller seed failed', error); process.exit(1) })

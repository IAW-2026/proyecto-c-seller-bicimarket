// Sample data for all screens
const SAMPLE_ORDERS = [
  {
    id: 'sor_01H8XQR2NK4P', date: '02/05/2026', status: 'pending',
    items: [
      { qty: 1, name: 'Trek Marlin 5 — Rodado 29 Talle M', price: 685000 },
    ],
    subtotal: 685000, shipping: 12500, total: 697500,
    address: 'Av. Cabildo 2530, CABA, Buenos Aires',
  },
  {
    id: 'sor_01H8XQS1A8VN', date: '02/05/2026', status: 'accepted',
    items: [
      { qty: 1, name: 'Vairo XR 4.0 — Rodado 29', price: 520000 },
      { qty: 2, name: 'Cámara MTB 29" Schwalbe', price: 8500 },
    ],
    subtotal: 537000, shipping: 8900, total: 545900,
    address: 'San Martín 145, Bariloche, Río Negro',
  },
  {
    id: 'sor_01H8XQT6P0K2', date: '01/05/2026', status: 'preparing',
    items: [
      { qty: 1, name: 'Specialized Allez Sport — Talle 54', price: 1850000 },
    ],
    subtotal: 1850000, shipping: 18000, total: 1868000,
    address: 'Belgrano 875, Rosario, Santa Fe',
  },
  {
    id: 'sor_01H8XQT9F2X8', date: '01/05/2026', status: 'ready_to_ship',
    items: [
      { qty: 1, name: 'SLP 5 Pro — Urbana Talle L', price: 295000 },
      { qty: 1, name: 'Casco Bell Spark 2 MIPS', price: 78900 },
    ],
    subtotal: 373900, shipping: 7500, total: 381400,
    address: 'Sarmiento 1240, Mendoza, Mendoza',
  },
  {
    id: 'sor_01H8XQUB3DM7', date: '30/04/2026', status: 'handed_over',
    items: [
      { qty: 1, name: 'Giant Talon 3 — Rodado 27.5', price: 612000 },
    ],
    subtotal: 612000, shipping: 9800, total: 621800,
    address: 'Yrigoyen 543, Córdoba, Córdoba',
  },
  {
    id: 'sor_01H8XQVD7WPP', date: '28/04/2026', status: 'delivered',
    items: [
      { qty: 1, name: 'Vairo Aspen 5.0 — Rodado 29', price: 489000 },
      { qty: 1, name: 'Luz delantera Cateye Volt', price: 32500 },
    ],
    subtotal: 521500, shipping: 8200, total: 529700,
    address: 'Av. Mitre 980, La Plata, Buenos Aires',
  },
];

const SAMPLE_HISTORY = [
  {
    id: 'sor_01H8WPM2KK91', date: '24/04/2026', status: 'delivered',
    items: [{ qty: 1, name: 'Trek FX 2 Disc — Híbrida Talle M', price: 745000 }],
    subtotal: 745000, shipping: 11500, total: 756500,
    address: 'Pellegrini 230, Tigre, Buenos Aires',
  },
  {
    id: 'sor_01H8WP8N3FQ4', date: '20/04/2026', status: 'rejected',
    items: [{ qty: 1, name: 'BMX Haro Downtown 20"', price: 215000 }],
    subtotal: 215000, shipping: 6500, total: 221500,
    address: 'Las Heras 87, Salta, Salta',
  },
];

const SAMPLE_PRODUCTS = [
  { id: 'prd_01', title: 'Trek Marlin 5 — Rodado 29', brand: 'Trek', model: 'Marlin 5', cat: 'MTB', condition: 'Nuevo', price: 685000, status: 'active', images: 3, hue: 168 },
  { id: 'prd_02', title: 'Vairo XR 4.0 — Rodado 29',   brand: 'Vairo', model: 'XR 4.0', cat: 'MTB', condition: 'Nuevo', price: 520000, status: 'active', images: 4, hue: 30 },
  { id: 'prd_03', title: 'Specialized Allez Sport',     brand: 'Specialized', model: 'Allez Sport', cat: 'Ruta', condition: 'Nuevo', price: 1850000, status: 'active', images: 5, hue: 220 },
  { id: 'prd_04', title: 'SLP 5 Pro Urbana Talle L',    brand: 'SLP', model: '5 Pro', cat: 'Urbana', condition: 'Usado — como nuevo', price: 295000, status: 'paused', images: 2, hue: 90 },
  { id: 'prd_05', title: 'Cámara MTB 29" Schwalbe',     brand: 'Schwalbe', model: 'AV19', cat: 'Repuestos', condition: 'Nuevo', price: 8500, status: 'draft', images: 0, hue: 320 },
  { id: 'prd_06', title: 'Casco Bell Spark 2 MIPS',     brand: 'Bell', model: 'Spark 2 MIPS', cat: 'Accesorios', condition: 'Nuevo', price: 78900, status: 'active', images: 2, hue: 50 },
];

const SAMPLE_PRODUCTS_ARCHIVED = [
  { id: 'prd_99', title: 'Mongoose Title Pro 2022', brand: 'Mongoose', model: 'Title Pro', cat: 'BMX', condition: 'Usado — buen estado', price: 145000, status: 'archived', images: 1, hue: 280 },
];

const SAMPLE_SETTLEMENTS = [
  { id: 'set_01H92F4QA8', order: 'sor_01H8WPM2KK91', date: '26/04/2026', gross: 756500, fee: 75650, net: 680850, status: 'paid' },
  { id: 'set_01H92F4QB9', order: 'sor_01H8WPDX12K', date: '24/04/2026', gross: 489000, fee: 48900, net: 440100, status: 'paid' },
  { id: 'set_01H92F4QCA', order: 'sor_01H8WPC8M2N', date: '22/04/2026', gross: 295000, fee: 29500, net: 265500, status: 'paid' },
  { id: 'set_01H92F4QDB', order: 'sor_01H8WPB7F4P', date: '20/04/2026', gross: 1240000, fee: 124000, net: 1116000, status: 'paid' },
  { id: 'set_01H92F5R8X', order: 'sor_01H8XQVD7WPP', date: '04/05/2026', gross: 529700, fee: 52970, net: 476730, status: 'pending' },
  { id: 'set_01H92F5S9Y', order: 'sor_01H8XQUB3DM7', date: '03/05/2026', gross: 621800, fee: 62180, net: 559620, status: 'manual_review' },
  { id: 'set_01H92E0K0J', order: 'sor_01H8VP1S2T3', date: '14/04/2026', gross: 312000, fee: 31200, net: 280800, status: 'failed' },
];

window.SAMPLE_ORDERS = SAMPLE_ORDERS;
window.SAMPLE_HISTORY = SAMPLE_HISTORY;
window.SAMPLE_PRODUCTS = SAMPLE_PRODUCTS;
window.SAMPLE_PRODUCTS_ARCHIVED = SAMPLE_PRODUCTS_ARCHIVED;
window.SAMPLE_SETTLEMENTS = SAMPLE_SETTLEMENTS;

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SELLER_CLERK_ID = 'user_seed_seller_001'
const SELLER_ID = 'slp_seed_bicicletas_del_sur'

type SeedProduct = {
  id: string
  title: string
  description: string
  brand: string
  model: string
  category: 'mtb' | 'road' | 'urban' | 'kids' | 'bmx' | 'parts' | 'accessories' | 'indumentaria'
  condition: 'new' | 'used_like_new' | 'used_good' | 'used_fair'
  priceCents: number
  weightGrams: number
  lengthCm: number
  widthCm: number
  heightCm: number
  images: { id: string; url: string; position: number }[]
}

// picsum.photos/id/<n>/800/600 returns a consistent photo for each <n>
const img = (id: string, url: string, position: number) => ({ id, url, position })

const products: SeedProduct[] = [
  // ─── MTB ──────────────────────────────────────────────────────────────────
  {
    id: 'prd_seed_mtb_trek_marlin7',
    title: 'Trek Marlin 7 Gen 2 29" 2024',
    description:
      'Hardtail XC/Trail con cuadro Alpha Silver Aluminum y horquilla RockShox Recon Silver de 100mm. Transmisión Shimano Deore 1x12 con cassette 11-51T. Frenos hidráulicos Shimano MT410. Ruedas 29" con llantas Bontrager Line doble pared. Ideal para senderos y terrenos mixtos. Talla disponibles: S, M, ML, L, XL.',
    brand: 'Trek',
    model: 'Marlin 7 Gen 2',
    category: 'mtb',
    condition: 'new',
    priceCents: 289000000, // ARS 2.890.000
    weightGrams: 14200,
    lengthCm: 180,
    widthCm: 80,
    heightCm: 110,
    images: [
      img('img_seed_mtb_trek_marlin7_1', 'https://picsum.photos/id/133/800/600', 0),
      img('img_seed_mtb_trek_marlin7_2', 'https://picsum.photos/id/134/800/600', 1),
      img('img_seed_mtb_trek_marlin7_3', 'https://picsum.photos/id/135/800/600', 2),
    ],
  },
  {
    id: 'prd_seed_mtb_giant_talon1',
    title: 'Giant Talon 1 29" 2024',
    description:
      'Bicicleta de montaña hardtail con cuadro ALUXX-Grade Aluminum. Horquilla SR Suntour XCR Air de 100mm con ajuste de rebote. Transmisión Shimano SLX M7100 1x12. Frenos hidráulicos Shimano MT420. Ruedas Giant TRX con neumáticos Maxxis Ardent 29x2.25". Peso: 13.8 kg. Tallas XS a XL.',
    brand: 'Giant',
    model: 'Talon 1 29',
    category: 'mtb',
    condition: 'new',
    priceCents: 215000000, // ARS 2.150.000
    weightGrams: 13800,
    lengthCm: 177,
    widthCm: 79,
    heightCm: 108,
    images: [
      img('img_seed_mtb_giant_talon1_1', 'https://picsum.photos/id/136/800/600', 0),
      img('img_seed_mtb_giant_talon1_2', 'https://picsum.photos/id/137/800/600', 1),
      img('img_seed_mtb_giant_talon1_3', 'https://picsum.photos/id/138/800/600', 2),
    ],
  },
  {
    id: 'prd_seed_mtb_specialized_rockhopper',
    title: 'Specialized Rockhopper Comp 29" 2024',
    description:
      'Cuadro A1 Premium Aluminum con geometría trail optimizada. Horquilla SR Suntour XCR de 120mm con rebote. Transmisión SRAM SX Eagle 1x12 con cassette 11-50T. Frenos SRAM Level hidráulicos. Neumáticos Specialized Ground Control 2.35" y Purgatory 2.3". Geometría agresiva para senderos técnicos.',
    brand: 'Specialized',
    model: 'Rockhopper Comp 29',
    category: 'mtb',
    condition: 'new',
    priceCents: 348000000, // ARS 3.480.000
    weightGrams: 13400,
    lengthCm: 182,
    widthCm: 82,
    heightCm: 115,
    images: [
      img('img_seed_mtb_spec_rh_1', 'https://picsum.photos/id/139/800/600', 0),
      img('img_seed_mtb_spec_rh_2', 'https://picsum.photos/id/140/800/600', 1),
    ],
  },

  // ─── ROAD ─────────────────────────────────────────────────────────────────
  {
    id: 'prd_seed_road_trek_domane',
    title: 'Trek Domane AL 2 Disc 700c 2024',
    description:
      'Endurance road bike con cuadro Alpha Silver Aluminum y horquilla de carbono IsoSpeed para absorción de vibraciones en rutas largas. Shimano Claris 2x8 velocidades. Frenos de disco mecánicos Tektro Spyre. Ruedas Bontrager Paradigm 700c con neumáticos Bontrager AW1 Hard-Case 700x32c. Ideal para cicloturismo.',
    brand: 'Trek',
    model: 'Domane AL 2 Disc',
    category: 'road',
    condition: 'new',
    priceCents: 322000000, // ARS 3.220.000
    weightGrams: 9800,
    lengthCm: 177,
    widthCm: 50,
    heightCm: 105,
    images: [
      img('img_seed_road_trek_domane_1', 'https://picsum.photos/id/146/800/600', 0),
      img('img_seed_road_trek_domane_2', 'https://picsum.photos/id/147/800/600', 1),
      img('img_seed_road_trek_domane_3', 'https://picsum.photos/id/148/800/600', 2),
    ],
  },
  {
    id: 'prd_seed_road_giant_contend',
    title: 'Giant Contend AR 3 700c 2024',
    description:
      'Adventure Road con cuadro ALUXX Aluminum. Diseñado para rutas mixtas asfaltadas y gravel liviano. Shimano Sora 2x9 velocidades. Frenos hidráulicos de disco Tektro. Neumáticos Giant Crosscut 700x35c con protección puncture. Horquilla de carbono integrada. Portabidón doble. Tallas XS a XL.',
    brand: 'Giant',
    model: 'Contend AR 3',
    category: 'road',
    condition: 'new',
    priceCents: 258000000, // ARS 2.580.000
    weightGrams: 9200,
    lengthCm: 175,
    widthCm: 48,
    heightCm: 103,
    images: [
      img('img_seed_road_giant_contend_1', 'https://picsum.photos/id/149/800/600', 0),
      img('img_seed_road_giant_contend_2', 'https://picsum.photos/id/150/800/600', 1),
    ],
  },
  {
    id: 'prd_seed_road_specialized_allez',
    title: 'Specialized Allez E5 Sport 700c 2024',
    description:
      'Race-bred road bike con cuadro E5 Premium Aluminum y horquilla de carbono FACT con dropout aero. Shimano 105 R7000 2x11 velocidades. Frenos de pinza Shimano 105 directo al cuadro. Ruedas Axis Elite con neumáticos Specialized Turbo Pro 700x26c. Posición agresiva de carretera. Incluye porta-herramientas bajo sillín.',
    brand: 'Specialized',
    model: 'Allez E5 Sport',
    category: 'road',
    condition: 'new',
    priceCents: 298000000, // ARS 2.980.000
    weightGrams: 8900,
    lengthCm: 173,
    widthCm: 50,
    heightCm: 102,
    images: [
      img('img_seed_road_spec_allez_1', 'https://picsum.photos/id/152/800/600', 0),
      img('img_seed_road_spec_allez_2', 'https://picsum.photos/id/153/800/600', 1),
      img('img_seed_road_spec_allez_3', 'https://picsum.photos/id/154/800/600', 2),
    ],
  },

  // ─── URBAN ────────────────────────────────────────────────────────────────
  {
    id: 'prd_seed_urban_trek_fx3',
    title: 'Trek FX 3 Disc 700c 2024',
    description:
      'Fitness/commuter versátil con cuadro Alpha Gold Aluminum ultraliviano. Shimano Deore 1x10. Frenos de disco hidráulicos Shimano MT200. Horquilla de carbono. Portabultos trasero integrado. Neumáticos Bontrager H2 32c reflectivos. Soporte para luz trasera incluido. Ideal para uso urbano diario y salidas largas los fines de semana.',
    brand: 'Trek',
    model: 'FX 3 Disc',
    category: 'urban',
    condition: 'new',
    priceCents: 118000000, // ARS 1.180.000
    weightGrams: 10200,
    lengthCm: 175,
    widthCm: 55,
    heightCm: 100,
    images: [
      img('img_seed_urban_trek_fx3_1', 'https://picsum.photos/id/161/800/600', 0),
      img('img_seed_urban_trek_fx3_2', 'https://picsum.photos/id/162/800/600', 1),
    ],
  },
  {
    id: 'prd_seed_urban_giant_escape3',
    title: 'Giant Escape 3 700c 2024',
    description:
      'Urban/fitness con cuadro ALUXX-Grade Aluminum de geometría erguida para visibilidad urbana. Shimano Acera 3x8 velocidades. Frenos de disco mecánicos Tektro. Guardabarros y portaequipaje trasero incluidos. Neumáticos Giant S-X3 700x35c reflectivos laterales. Iluminación LED frontal y trasera recargable USB. Talla S a XL.',
    brand: 'Giant',
    model: 'Escape 3',
    category: 'urban',
    condition: 'new',
    priceCents: 92000000, // ARS 920.000
    weightGrams: 11200,
    lengthCm: 172,
    widthCm: 52,
    heightCm: 98,
    images: [
      img('img_seed_urban_giant_escape3_1', 'https://picsum.photos/id/164/800/600', 0),
      img('img_seed_urban_giant_escape3_2', 'https://picsum.photos/id/165/800/600', 1),
      img('img_seed_urban_giant_escape3_3', 'https://picsum.photos/id/166/800/600', 2),
    ],
  },
  {
    id: 'prd_seed_urban_cannondale_quick5',
    title: 'Cannondale Quick 5 700c 2024',
    description:
      'Commuter ágil con cuadro SmartForm C3 Alloy liviano. Shimano Tourney 7 velocidades. Frenos V-Brake con cables nuevos. Guardabarros integrados. Portaequipaje trasero con capacidad 18 kg. Neumáticos Schwalbe Marathon Plus 700x35c antipinchazos. Manillar flat de 680mm. Peso: 11.8 kg. Llega lista para usar.',
    brand: 'Cannondale',
    model: 'Quick 5',
    category: 'urban',
    condition: 'new',
    priceCents: 105000000, // ARS 1.050.000
    weightGrams: 11800,
    lengthCm: 170,
    widthCm: 50,
    heightCm: 99,
    images: [
      img('img_seed_urban_cann_quick5_1', 'https://picsum.photos/id/167/800/600', 0),
      img('img_seed_urban_cann_quick5_2', 'https://picsum.photos/id/168/800/600', 1),
    ],
  },

  // ─── KIDS ─────────────────────────────────────────────────────────────────
  {
    id: 'prd_seed_kids_trek_precaliber20',
    title: 'Trek Precaliber 20 7SP 2024',
    description:
      'Para niños de 6 a 8 años (altura recomendada 115–130 cm). Cuadro Alpha Silver Aluminum resistente y liviano. 7 velocidades Shimano para aprender cambios. Frenos de mano Easy Reach ajustados para manos pequeñas. Ruedas 20" con neumáticos Bontrager Kids 1.75". Reflectivos delante, atrás y en ruedas. Incluye timbre.',
    brand: 'Trek',
    model: 'Precaliber 20 7SP',
    category: 'kids',
    condition: 'new',
    priceCents: 62000000, // ARS 620.000
    weightGrams: 8500,
    lengthCm: 132,
    widthCm: 55,
    heightCm: 80,
    images: [
      img('img_seed_kids_trek_precal_1', 'https://picsum.photos/id/171/800/600', 0),
      img('img_seed_kids_trek_precal_2', 'https://picsum.photos/id/172/800/600', 1),
    ],
  },
  {
    id: 'prd_seed_kids_giant_arx20',
    title: 'Giant ARX 20 FS 2024',
    description:
      'Bicicleta infantil 20" para niños de 5 a 8 años con cuadro ALUXX Aluminum y horquilla de suspensión delantera. 7 velocidades Shimano con frenos de mano. Neumáticos Giant 20x2.0. Manillar y sillín ajustables. Guardabarros integrados. Disponible en azul, rojo y verde. Peso: 9.0 kg. Incluye portabidón y portaequipaje.',
    brand: 'Giant',
    model: 'ARX 20 FS',
    category: 'kids',
    condition: 'new',
    priceCents: 51000000, // ARS 510.000
    weightGrams: 9000,
    lengthCm: 130,
    widthCm: 53,
    heightCm: 78,
    images: [
      img('img_seed_kids_giant_arx20_1', 'https://picsum.photos/id/174/800/600', 0),
      img('img_seed_kids_giant_arx20_2', 'https://picsum.photos/id/175/800/600', 1),
      img('img_seed_kids_giant_arx20_3', 'https://picsum.photos/id/176/800/600', 2),
    ],
  },
  {
    id: 'prd_seed_kids_specialized_hotrock20',
    title: 'Specialized Hotrock 20 Coaster 2024',
    description:
      'MTB infantil 20" inspirada en las bikes de adulto. Cuadro A1 Premium Aluminum. Horquilla de suspensión SR Suntour 50mm. 7 velocidades Shimano. Freno coaster trasero + freno de mano delantero. Neumáticos Specialized XC 20x2.0. Para niños de 5 a 8 años. Diseño llamativo en rojo/negro. Peso: 8.8 kg.',
    brand: 'Specialized',
    model: 'Hotrock 20 Coaster',
    category: 'kids',
    condition: 'new',
    priceCents: 57000000, // ARS 570.000
    weightGrams: 8800,
    lengthCm: 131,
    widthCm: 54,
    heightCm: 79,
    images: [
      img('img_seed_kids_spec_hotrock_1', 'https://picsum.photos/id/177/800/600', 0),
      img('img_seed_kids_spec_hotrock_2', 'https://picsum.photos/id/178/800/600', 1),
    ],
  },

  // ─── BMX ──────────────────────────────────────────────────────────────────
  {
    id: 'prd_seed_bmx_haro_downtown20',
    title: 'Haro Downtown 20" 2024',
    description:
      'BMX de calle y skatepark para principiantes e intermedios. Cuadro Hi-Ten steel doble refuerzo con geometría clásica park. Manillar 4 piezas 9.1" de alto. Pedales de plástico anchos antideslizantes. Llantas doble pared 20x2.35" con neumáticos Haro Shovel Nose. Freno U-brake trasero. Peso total: 11.8 kg.',
    brand: 'Haro',
    model: 'Downtown 20',
    category: 'bmx',
    condition: 'new',
    priceCents: 78000000, // ARS 780.000
    weightGrams: 10800,
    lengthCm: 150,
    widthCm: 55,
    heightCm: 85,
    images: [
      img('img_seed_bmx_haro_down_1', 'https://picsum.photos/id/181/800/600', 0),
      img('img_seed_bmx_haro_down_2', 'https://picsum.photos/id/182/800/600', 1),
    ],
  },
  {
    id: 'prd_seed_bmx_cult_devotion',
    title: 'Cult Devotion 20.75" 2024',
    description:
      'BMX freestyle nivel intermedio-avanzado. Cuadro Chromoly 4130 con dropouts para pegs reforzados. Horquilla Chromoly 28mm. Llantas doble pared Cult Match V2 36h. Neumáticos Cult Vans 20x2.35". Pedales Cult Lib composite. Sin frenos (brakeless). Top tube: 20.75". Manubrio: 9" alto x 28" ancho. Para calle y skatepark.',
    brand: 'Cult',
    model: 'Devotion 20.75',
    category: 'bmx',
    condition: 'new',
    priceCents: 92000000, // ARS 920.000
    weightGrams: 10500,
    lengthCm: 148,
    widthCm: 54,
    heightCm: 84,
    images: [
      img('img_seed_bmx_cult_dev_1', 'https://picsum.photos/id/184/800/600', 0),
      img('img_seed_bmx_cult_dev_2', 'https://picsum.photos/id/185/800/600', 1),
      img('img_seed_bmx_cult_dev_3', 'https://picsum.photos/id/186/800/600', 2),
    ],
  },
  {
    id: 'prd_seed_bmx_sunday_sweeper',
    title: 'Sunday Street Sweeper 20.75" 2024',
    description:
      'BMX street signature pro con cuadro Sunday Chromoly y gusset reinforcements en puntos críticos. Mesa Sunday Cornerstone 10" cromada. Horquilla Sunday Primary 20mm con dropout protectors. Llantas Sunday Sabretooth 36h doble pared. Crank Sunday Sabretooth 8-spline 170mm. Sin frenos. Top tube: 20.75". Para riders avanzados de calle.',
    brand: 'Sunday',
    model: 'Street Sweeper 20.75',
    category: 'bmx',
    condition: 'new',
    priceCents: 118000000, // ARS 1.180.000
    weightGrams: 11200,
    lengthCm: 152,
    widthCm: 56,
    heightCm: 86,
    images: [
      img('img_seed_bmx_sunday_sw_1', 'https://picsum.photos/id/187/800/600', 0),
      img('img_seed_bmx_sunday_sw_2', 'https://picsum.photos/id/188/800/600', 1),
    ],
  },

  // ─── PARTS ────────────────────────────────────────────────────────────────
  {
    id: 'prd_seed_parts_shimano_xt_m8100',
    title: 'Kit Grupeto Shimano Deore XT M8100 12v',
    description:
      'Kit XC 12 velocidades para MTB. Incluye: desviador trasero XT M8100-GS Shadow+, palanca SL-M8100-IR I-Spec EV, cassette CS-M8100 10-51T HG+, cadena CN-M8100. Compatible con microspline y HG estándar. No incluye corona delantera. Peso conjunto: 665g. Montaje para eje BB estándar. Ideal para XC y trail exigente.',
    brand: 'Shimano',
    model: 'Deore XT M8100 12v',
    category: 'parts',
    condition: 'new',
    priceCents: 145000000, // ARS 1.450.000
    weightGrams: 2100,
    lengthCm: 35,
    widthCm: 25,
    heightCm: 15,
    images: [
      img('img_seed_parts_shim_xt_1', 'https://picsum.photos/id/191/800/600', 0),
      img('img_seed_parts_shim_xt_2', 'https://picsum.photos/id/192/800/600', 1),
    ],
  },
  {
    id: 'prd_seed_parts_sram_gx_eagle',
    title: 'Grupeto SRAM GX Eagle 12v',
    description:
      'Grupeto MTB 12 velocidades SRAM GX Eagle. Incluye: desviador trasero GX Eagle X-Horizon, palanca Trigger GX Eagle, cassette XG-1275 10-52T microspline, cadena PC-Eagle 12v. Diseño inspirado en XX1 Eagle a precio accesible. Upgrade-ready para SRAM Eagle AXS inalámbrico. Peso: 589g. Compatible con cuadros boost y non-boost.',
    brand: 'SRAM',
    model: 'GX Eagle 12v',
    category: 'parts',
    condition: 'new',
    priceCents: 178000000, // ARS 1.780.000
    weightGrams: 1950,
    lengthCm: 33,
    widthCm: 24,
    heightCm: 14,
    images: [
      img('img_seed_parts_sram_gx_1', 'https://picsum.photos/id/194/800/600', 0),
      img('img_seed_parts_sram_gx_2', 'https://picsum.photos/id/195/800/600', 1),
      img('img_seed_parts_sram_gx_3', 'https://picsum.photos/id/196/800/600', 2),
    ],
  },
  {
    id: 'prd_seed_parts_rockshox_recon_rl',
    title: 'Horquilla RockShox Recon Silver RL 29" 100mm',
    description:
      'Horquilla air-spring para MTB y XC trail 29". Recorrido: 100mm. Amortiguador Solo Air con ajuste de rebote externo TurnKey. Columna 1-1/8" straight, QR 9mm. Offset 51mm. Compatible con frenos de disco post mount (adaptador 160mm incluido). Paso de cable hidráulico. Peso: 2.05 kg. Color negro mate con deco plateado.',
    brand: 'RockShox',
    model: 'Recon Silver RL 29 100mm',
    category: 'parts',
    condition: 'new',
    priceCents: 108000000, // ARS 1.080.000
    weightGrams: 2200,
    lengthCm: 105,
    widthCm: 15,
    heightCm: 15,
    images: [
      img('img_seed_parts_rshox_recon_1', 'https://picsum.photos/id/197/800/600', 0),
      img('img_seed_parts_rshox_recon_2', 'https://picsum.photos/id/198/800/600', 1),
    ],
  },
  {
    id: 'prd_seed_parts_fox_32_rhythm',
    title: 'Horquilla Fox 32 Rhythm GRIP 29" 120mm 2024',
    description:
      'Horquilla Factory Fox 32 con cartridge GRIP (Hydraulic Rebound + Manual lockout remoto). Recorrido: 120mm. Barrel de 32mm. Estándar Boost 15x110mm Kabolt. Offset 44mm. QR incluido con adaptador. Peso: 1.98 kg. Acabado negro mate con logo dorado. Compatible con palanca de bloqueo en manillar. Para trail y enduro liviano.',
    brand: 'Fox',
    model: '32 Rhythm GRIP 29 120mm',
    category: 'parts',
    condition: 'new',
    priceCents: 138000000, // ARS 1.380.000
    weightGrams: 1980,
    lengthCm: 108,
    widthCm: 16,
    heightCm: 16,
    images: [
      img('img_seed_parts_fox32_1', 'https://picsum.photos/id/200/800/600', 0),
      img('img_seed_parts_fox32_2', 'https://picsum.photos/id/201/800/600', 1),
      img('img_seed_parts_fox32_3', 'https://picsum.photos/id/202/800/600', 2),
    ],
  },

  // ─── ACCESSORIES ──────────────────────────────────────────────────────────
  {
    id: 'prd_seed_acc_garmin_edge540',
    title: 'Garmin Edge 540 GPS Cycling Computer',
    description:
      'Ciclocomputador GPS premium con mapas Garmin Cycle Map y navegación giro a giro. Pantalla color 2.6" transflectiva visible a plena luz. ANT+ y Bluetooth dual. Compatible con sensores de potencia, cadencia y FC. Batería: 26h GPS básico / 16h mapa completo. ClimbPro, alerta de accidente y GroupTrack. Soporte manillar incluido.',
    brand: 'Garmin',
    model: 'Edge 540',
    category: 'accessories',
    condition: 'new',
    priceCents: 48000000, // ARS 480.000
    weightGrams: 320,
    lengthCm: 12,
    widthCm: 8,
    heightCm: 3,
    images: [
      img('img_seed_acc_garmin540_1', 'https://picsum.photos/id/204/800/600', 0),
      img('img_seed_acc_garmin540_2', 'https://picsum.photos/id/205/800/600', 1),
    ],
  },
  {
    id: 'prd_seed_acc_casco_giro_syntax_mips',
    title: 'Casco Giro Syntax MIPS 2024',
    description:
      'Casco de ruta/fitness con sistema MIPS (protección multi-impacto). 22 ventilaciones profundas con canales internos. Sistema de retención Roc Loc 5 ajustable. Cierre magnético Fidlock SNAP. Tallas: S (51–55 cm), M (55–59 cm), L (59–63 cm). Peso: 290 g (talla M). Compatible con soporte de luz trasera Blendr. CE EN 1078 y CPSC.',
    brand: 'Giro',
    model: 'Syntax MIPS',
    category: 'accessories',
    condition: 'new',
    priceCents: 32000000, // ARS 320.000
    weightGrams: 290,
    lengthCm: 30,
    widthCm: 22,
    heightCm: 18,
    images: [
      img('img_seed_acc_giro_syntax_1', 'https://picsum.photos/id/207/800/600', 0),
      img('img_seed_acc_giro_syntax_2', 'https://picsum.photos/id/208/800/600', 1),
      img('img_seed_acc_giro_syntax_3', 'https://picsum.photos/id/209/800/600', 2),
    ],
  },
  {
    id: 'prd_seed_acc_shimano_pdm530',
    title: 'Pedales Shimano PD-M530 SPD Trail',
    description:
      'Pedales clipless SPD para MTB y trail. Plataforma de aluminio fundido sin plástico. Sistema liberación doble lado (dual release). Compatible con calas SM-SH51 single release y SM-SH56 multi release (incluidas). Cuerpo aluminio con eje de acero cromado. Peso: 384 g el par. Para cross-country, gravel y enduro técnico.',
    brand: 'Shimano',
    model: 'PD-M530',
    category: 'accessories',
    condition: 'new',
    priceCents: 14500000, // ARS 145.000
    weightGrams: 520,
    lengthCm: 20,
    widthCm: 15,
    heightCm: 8,
    images: [
      img('img_seed_acc_pedales_shim_1', 'https://picsum.photos/id/210/800/600', 0),
      img('img_seed_acc_pedales_shim_2', 'https://picsum.photos/id/211/800/600', 1),
    ],
  },
  {
    id: 'prd_seed_acc_wahoo_elemnt_bolt',
    title: 'Wahoo ELEMNT Bolt v2 GPS Cycling Computer',
    description:
      'Ciclocomputador GPS aerodinámico para manillar de ruta. Pantalla E-Ink 2.2" monocromática ultra contraste. Batería: 15h. ANT+/Bluetooth dual. Mapas built-in con giro a giro. Compatible con Strava, TrainingPeaks, Komoot. Sincronización automática con smartphone. Peso: 61 g. Montaje aerodinámico para manillar de ruta incluido.',
    brand: 'Wahoo',
    model: 'ELEMNT Bolt v2',
    category: 'accessories',
    condition: 'new',
    priceCents: 52000000, // ARS 520.000
    weightGrams: 280,
    lengthCm: 11,
    widthCm: 7,
    heightCm: 3,
    images: [
      img('img_seed_acc_wahoo_bolt_1', 'https://picsum.photos/id/213/800/600', 0),
      img('img_seed_acc_wahoo_bolt_2', 'https://picsum.photos/id/214/800/600', 1),
    ],
  },

  // ─── INDUMENTARIA ─────────────────────────────────────────────────────────
  {
    id: 'prd_seed_indum_castelli_aero_rc',
    title: 'Maillot Castelli Free Aero RC Jersey Hombre 2024',
    description:
      'Maillot de carretera alta performance. Tela Free Aero (88% poliéster, 12% elastano). 4 bolsillos traseros: 3 abiertos + 1 con cierre YKK. Cierre frontal 25 cm. Mangas con silicona antideslizante. Protección UPF 50+. Corte ergo ajustado para posición aerodinámica. Tallas XS–2XL. Lavable a máquina 30°C. Fabricado en Italia.',
    brand: 'Castelli',
    model: 'Free Aero RC Jersey',
    category: 'indumentaria',
    condition: 'new',
    priceCents: 16500000, // ARS 165.000
    weightGrams: 250,
    lengthCm: 35,
    widthCm: 28,
    heightCm: 5,
    images: [
      img('img_seed_indum_castelli_1', 'https://picsum.photos/id/217/800/600', 0),
      img('img_seed_indum_castelli_2', 'https://picsum.photos/id/218/800/600', 1),
    ],
  },
  {
    id: 'prd_seed_indum_rapha_bib_shorts',
    title: 'Culotte Rapha Core Cargo Bib Shorts 2024',
    description:
      'Culotte largo con tiradores y bolsillos cargo laterales. Tela Rapha CORE (nylon reciclado + elastano). Badana Elastic Interface Classic 3D de alta densidad. Tiradores ventilados de malla transpirable. Pierna con silicona antideslizante de 8 cm. Tallas XS–2XL. Para cicloturismo y rutas de larga distancia. OEKO-TEX Standard 100. Negro.',
    brand: 'Rapha',
    model: 'Core Cargo Bib Shorts',
    category: 'indumentaria',
    condition: 'new',
    priceCents: 24000000, // ARS 240.000
    weightGrams: 310,
    lengthCm: 34,
    widthCm: 26,
    heightCm: 4,
    images: [
      img('img_seed_indum_rapha_1', 'https://picsum.photos/id/220/800/600', 0),
      img('img_seed_indum_rapha_2', 'https://picsum.photos/id/221/800/600', 1),
      img('img_seed_indum_rapha_3', 'https://picsum.photos/id/222/800/600', 2),
    ],
  },
  {
    id: 'prd_seed_indum_pearl_izumi_quest',
    title: 'Maillot Pearl Izumi Quest Jersey Hombre 2024',
    description:
      'Maillot manga corta para ciclismo recreativo y fitness. Tela SELECT Transfer para gestión de humedad y secado rápido. 3 bolsillos traseros + 1 bolsillo extra con cierre para llaves o tarjeta. Silicona en mangas. Estampado sublimado resistente al desteñido. UPF 50+. Tallas S–3XL. Lavable a máquina. Disponible en 3 colores.',
    brand: 'Pearl Izumi',
    model: 'Quest Jersey',
    category: 'indumentaria',
    condition: 'new',
    priceCents: 12500000, // ARS 125.000
    weightGrams: 260,
    lengthCm: 33,
    widthCm: 27,
    heightCm: 4,
    images: [
      img('img_seed_indum_pearl_1', 'https://picsum.photos/id/223/800/600', 0),
      img('img_seed_indum_pearl_2', 'https://picsum.photos/id/224/800/600', 1),
    ],
  },
]

async function main() {
  console.log('Seeding database...')

  const seller = await prisma.sellerProfile.upsert({
    where: { clerkUserId: SELLER_CLERK_ID },
    update: {},
    create: {
      id: SELLER_ID,
      clerkUserId: SELLER_CLERK_ID,
      legalName: 'Bicicletas del Sur S.A.',
      displayName: 'Bici del Sur',
      taxId: '30-71234567-0',
      taxCondition: 'responsable_inscripto',
      bankAccountReference: 'mp_collector_123456789',
      verificationStatus: 'verified',
      pickupAddress: {
        street: 'Av. Corrientes',
        number: '4521',
        apartment: null,
        city: 'Buenos Aires',
        province: 'CABA',
        postalCode: 'C1195AAK',
        country: 'AR',
      },
    },
  })

  console.log(`  Seller: ${seller.displayName} (${seller.verificationStatus})`)

  let created = 0
  let skipped = 0

  for (const { images, ...productData } of products) {
    const exists = await prisma.product.findUnique({ where: { id: productData.id } })

    if (exists) {
      skipped++
      continue
    }

    await prisma.product.create({
      data: {
        ...productData,
        sellerProfileId: seller.id,
        images: { create: images },
      },
    })

    console.log(`  [${productData.category.toUpperCase().padEnd(12)}] ${productData.title}`)
    created++
  }

  const total = products.length
  console.log(
    `\nDone. ${created} products created, ${skipped} skipped (already exist). Total: ${total} across 8 categories.`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

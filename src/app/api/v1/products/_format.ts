export function formatProduct(p: {
  id: string;
  sellerProfileId: string;
  title: string;
  description: string;
  brand: string;
  model: string;
  category: string;
  condition: string;
  priceCents: number;
  discountPercent: number;
  currency: string;
  weightGrams: number;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  status: string;
  createdAt: Date;
  images: { id: string; url: string; position: number }[];
}) {
  return {
    id: p.id,
    seller_profile_id: p.sellerProfileId,
    title: p.title,
    description: p.description,
    brand: p.brand,
    model: p.model,
    category: p.category,
    condition: p.condition,
    price_cents: p.priceCents,
    discount_percent: p.discountPercent,
    discounted_price_cents: Math.round(p.priceCents * (1 - p.discountPercent / 100)),
    currency: p.currency,
    weight_grams: p.weightGrams,
    dimensions_cm:
      p.lengthCm && p.widthCm && p.heightCm
        ? { length: p.lengthCm, width: p.widthCm, height: p.heightCm }
        : null,
    status: p.status,
    images: p.images.map((img) => ({ id: img.id, url: img.url, position: img.position })),
    created_at: p.createdAt,
  };
}

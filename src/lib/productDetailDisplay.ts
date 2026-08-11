import type { Product, ProductId } from "@/lib/products";

/** Per-product 3D scale — ~2× for taller detail presentation. */
export const PRODUCT_DETAIL_SIZES: Record<
  ProductId,
  { mobile: number; desktop: number }
> = {
  pro1: { mobile: 0.56, desktop: 0.52 },
  pro2: { mobile: 0.6, desktop: 0.56 },
  pro3: { mobile: 0.64, desktop: 0.6 },
  pro4: { mobile: 0.95, desktop: 1.05 },
  pro5: { mobile: 0.85, desktop: 0.92 },
  protest: { mobile: 1.0, desktop: 1.0 },
};

export function getProductDetailDisplaySize(product: Product, viewportWidth: number): number {
  const sizes = PRODUCT_DETAIL_SIZES[product.id];
  return viewportWidth < 768 ? sizes.mobile : sizes.desktop;
}

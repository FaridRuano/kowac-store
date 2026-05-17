import ProductGallery from "@/components/product/ProductGallery";
import VariantSelector from "@/components/product/VariantSelector";

const sampleVariants = [
  { sku: "KWC-BOOT-37-BLK", colorName: "Negro", size: "37" },
  { sku: "KWC-BOOT-38-BLK", colorName: "Negro", size: "38" },
  { sku: "KWC-BOOT-39-TAN", colorName: "Cuero", size: "39" },
];

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;
  const title = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <section className="simple-page">
      <div className="container product-detail-grid">
        <ProductGallery />

        <div className="stack-lg">
          <div className="stack-sm">
            <span className="eyebrow">Producto</span>
            <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "3.1rem" }}>{title}</h1>
            <p className="text-muted" style={{ margin: 0 }}>
              Página dinámica preparada para consultar productos por `slug` o `id` vía API.
            </p>
          </div>

          <div className="card-surface" style={{ padding: "1.5rem" }}>
            <div className="stack-sm">
              <strong style={{ fontSize: "1.1rem" }}>$129.90</strong>
              <p className="text-muted" style={{ margin: 0 }}>
                Espacio listo para descripción larga, stock por variante y CTA de compra.
              </p>
            </div>
          </div>

          <VariantSelector variants={sampleVariants} />
        </div>
      </div>
    </section>
  );
}

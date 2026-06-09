import Link from "next/link";

import ProductGrid from "@/components/product/ProductGrid";

const campaignPanels = [
  {
    slug: "zapatos",
    title: "Campaña Zapatos",
    tag: "Espacio imagen 01",
    size: "large",
  },
  {
    slug: "ropa",
    title: "Drop Ropa",
    tag: "Espacio imagen 02",
    size: "small",
  },
];

const featuredProducts = [
  {
    slug: "kowac-andes-boot",
    name: "Andes Boot",
    brand: "Kowac",
    price: 149.9,
    compareAtPrice: 179.9,
    isFeatured: true,
    images: [],
  },
  {
    slug: "kowac-sierra-loafer",
    name: "Sierra Loafer",
    brand: "Kowac",
    price: 119.9,
    images: [],
  },
  {
    slug: "kowac-heritage-jacket",
    name: "Heritage Jacket",
    brand: "Kowac",
    price: 134.5,
    images: [],
  },
];

export default function HomePage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="hero-media-layout">
            <div className="hero-copy-panel card-surface stack-md">
              <span className="eyebrow">Nueva colección</span>
              <h1 className="hero-title">Más imagen. Más producto.</h1>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <Link href="/zapatos" className="button-primary">
                  Ver productos
                </Link>
                <Link href="/zapatos" className="button-secondary">
                  Ver zapatos
                </Link>
              </div>
            </div>

            <div className="hero-visual hero-visual--primary card-surface">
              <span className="visual-label">Espacio imagen hero principal</span>
            </div>

            <div className="hero-visual hero-visual--secondary card-surface">
              <span className="visual-label">Espacio imagen editorial secundaria</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div className="stack-sm">
              <span className="eyebrow">Campañas</span>
              <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "2.4rem" }}>
                Visuales para producto
              </h2>
            </div>
          </div>

          <div className="campaign-grid">
            {campaignPanels.map((panel) => (
              <Link
                key={panel.slug}
                href={`/${panel.slug}`}
                className={`campaign-card campaign-card--${panel.size} card-surface`}
              >
                <span className="visual-label">{panel.tag}</span>
                <div className="campaign-card__content">
                  <strong>{panel.title}</strong>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="lookbook-strip">
            <div className="lookbook-tile card-surface">
              <span className="visual-label">Espacio imagen lookbook 01</span>
            </div>
            <div className="lookbook-tile card-surface">
              <span className="visual-label">Espacio imagen lookbook 02</span>
            </div>
            <div className="lookbook-tile card-surface">
              <span className="visual-label">Espacio imagen lookbook 03</span>
            </div>
            <div className="lookbook-copy card-surface">
              <span className="eyebrow">Drop</span>
              <strong>Zapatos y ropa en primer plano.</strong>
              <Link href="/zapatos" className="button-primary">
                Comprar ahora
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div className="stack-sm">
              <span className="eyebrow">Selección</span>
              <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "2.4rem" }}>
                Productos destacados
              </h2>
            </div>
          </div>

          <ProductGrid products={featuredProducts} />
        </div>
      </section>
    </>
  );
}

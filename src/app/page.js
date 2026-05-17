import Link from "next/link";

import ProductGrid from "@/components/product/ProductGrid";

const featuredCategories = [
  {
    slug: "zapatos",
    title: "Zapatos",
    description: "Siluetas pensadas para carácter, comodidad y presencia.",
  },
  {
    slug: "ropa",
    title: "Ropa",
    description: "Capas esenciales con materiales nobles y mirada contemporánea.",
  },
  {
    slug: "accesorios",
    title: "Accesorios",
    description: "Detalles que completan el gesto de la marca.",
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
          <div className="hero-layout">
            <div className="hero-panel card-surface stack-lg">
              <span className="eyebrow">Kowac Ecuador</span>

              <div className="stack-md">
                <h1 className="hero-title">Calzado y estilo ecuatoriano para caminar con carácter</h1>
                <p className="hero-copy">
                  Una base de e-commerce diseñada para que Kowac crezca con catálogo propio,
                  variantes complejas y una experiencia de marca más cuidada que una tienda genérica.
                </p>
              </div>

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <Link href="/tienda" className="button-primary">
                  Explorar colección
                </Link>
                <Link href="/admin" className="button-secondary">
                  Ver panel base
                </Link>
              </div>
            </div>

            <div className="hero-visual card-surface">
              <div className="hero-stat">
                <strong>Fase 1 lista para crecer</strong>
                <p style={{ margin: "0.5rem 0 0", color: "var(--color-muted)" }}>
                  Modelos, API inicial y storefront base preparados para catálogo real.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div className="stack-sm">
              <span className="eyebrow">Categorías</span>
              <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "2.4rem" }}>
                Universo Kowac
              </h2>
            </div>
          </div>

          <div className="feature-grid">
            {featuredCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/tienda?type=${category.slug}`}
                className="card-surface"
                style={{ padding: "1.75rem", minHeight: "220px", display: "flex", alignItems: "end" }}
              >
                <div className="stack-sm">
                  <strong style={{ fontSize: "1.3rem" }}>{category.title}</strong>
                  <p className="text-muted" style={{ margin: 0 }}>
                    {category.description}
                  </p>
                </div>
              </Link>
            ))}
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

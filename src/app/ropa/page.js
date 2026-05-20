import ProductGrid from "@/components/product/ProductGrid";

const apparelProducts = [
  {
    slug: "kowac-heritage-jacket",
    name: "Heritage Jacket",
    brand: "Kowac",
    price: 134.5,
    compareAtPrice: 159.9,
    isFeatured: true,
    type: "ropa",
    images: [],
  },
  {
    slug: "kowac-atelier-shirt",
    name: "Atelier Shirt",
    brand: "Kowac",
    price: 79.9,
    type: "ropa",
    images: [],
  },
  {
    slug: "kowac-studio-trouser",
    name: "Studio Trouser",
    brand: "Kowac",
    price: 94.9,
    type: "ropa",
    images: [],
  },
];

export const metadata = {
  title: "Ropa | Kowac",
};

export default async function ApparelPage({ searchParams }) {
  const params = await searchParams;
  const subtype = params?.subtype;

  return (
    <section className="simple-page">
      <div className="container stack-lg">
        <div className="stack-sm">
          <span className="eyebrow">Ropa</span>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "3.4rem" }}>
            {subtype ? `Ropa / ${subtype}` : "Colección de ropa"}
          </h1>
          <p className="text-muted" style={{ maxWidth: "760px", margin: 0 }}>
            Página base para indumentaria Kowac, preparada para subcategorías, campañas y producto real.
          </p>
        </div>

        <ProductGrid products={apparelProducts} />
      </div>
    </section>
  );
}

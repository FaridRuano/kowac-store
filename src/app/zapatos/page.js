import ProductGrid from "@/components/product/ProductGrid";

const shoeProducts = [
  {
    slug: "kowac-urban-oxford",
    name: "Urban Oxford",
    brand: "Kowac",
    price: 129.9,
    compareAtPrice: 154.9,
    isFeatured: true,
    type: "zapatos",
    images: [],
  },
  {
    slug: "kowac-andes-boot",
    name: "Andes Boot",
    brand: "Kowac",
    price: 149.9,
    type: "zapatos",
    images: [],
  },
  {
    slug: "kowac-sierra-loafer",
    name: "Sierra Loafer",
    brand: "Kowac",
    price: 119.9,
    type: "zapatos",
    images: [],
  },
];

export const metadata = {
  title: "Zapatos | Kowac",
};

export default async function ShoesPage({ searchParams }) {
  const params = await searchParams;
  const subtype = params?.subtype;

  return (
    <section className="simple-page">
      <div className="container stack-lg">
        <div className="stack-sm">
          <span className="eyebrow">Zapatos</span>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "3.4rem" }}>
            {subtype ? `Zapatos / ${subtype}` : "Colección de zapatos"}
          </h1>
          <p className="text-muted" style={{ maxWidth: "760px", margin: 0 }}>
            Página base para la categoría de calzado Kowac, lista para conectar filtros y catálogo real.
          </p>
        </div>

        <ProductGrid products={shoeProducts} />
      </div>
    </section>
  );
}

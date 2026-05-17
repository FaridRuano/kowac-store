import ProductGrid from "@/components/product/ProductGrid";

const sampleProducts = [
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
    slug: "kowac-atelier-shirt",
    name: "Atelier Shirt",
    brand: "Kowac",
    price: 79.9,
    type: "ropa",
    images: [],
  },
  {
    slug: "kowac-leather-belt",
    name: "Leather Belt",
    brand: "Kowac",
    price: 54.9,
    type: "accesorios",
    images: [],
  },
];

export const metadata = {
  title: "Tienda | Kowac",
};

export default function ShopPage() {
  return (
    <section className="simple-page">
      <div className="container stack-lg">
        <div className="stack-sm">
          <span className="eyebrow">Tienda</span>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "3.4rem" }}>
            Catálogo base
          </h1>
          <p className="text-muted" style={{ maxWidth: "760px", margin: 0 }}>
            Esta vista ya está preparada para conectarse a `/api/products` y filtrar por categoría,
            tipo, género o búsqueda.
          </p>
        </div>

        <ProductGrid products={sampleProducts} />
      </div>
    </section>
  );
}

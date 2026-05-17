import CartItem from "@/components/cart/CartItem";

const sampleCart = [
  {
    productName: "Andes Boot",
    sku: "KWC-AND-39-BRN",
    quantity: 1,
  },
];

export const metadata = {
  title: "Carrito | Kowac",
};

export default function CartPage() {
  return (
    <section className="simple-page">
      <div className="container stack-lg">
        <div className="stack-sm">
          <span className="eyebrow">Carrito</span>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "3.2rem" }}>
            Resumen de compra
          </h1>
        </div>

        <div className="stack-md">
          {sampleCart.map((item) => (
            <CartItem key={item.sku} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

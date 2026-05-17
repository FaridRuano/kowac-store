export const metadata = {
  title: "Checkout | Kowac",
};

export default function CheckoutPage() {
  return (
    <section className="simple-page">
      <div className="container">
        <div className="simple-page__box card-surface stack-md">
          <span className="eyebrow">Checkout</span>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "3rem" }}>
            Proceso de pago
          </h1>
          <p className="text-muted" style={{ margin: 0 }}>
            Base lista para integrar dirección de envío, método de pago y creación de pedidos.
          </p>
        </div>
      </div>
    </section>
  );
}

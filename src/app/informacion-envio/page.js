export const metadata = {
  title: "Información de envío | Kowac",
};

export default function ShippingPage() {
  return (
    <section className="simple-page">
      <div className="container">
        <div className="simple-page__box card-surface" style={{ display: "grid", gap: "1.1rem" }}>
          <span className="eyebrow">Ayuda</span>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "3rem" }}>
            Información de envío
          </h1>
          <p style={{ margin: 0, color: "var(--color-muted)", lineHeight: 1.8 }}>
            Esta página base servirá para explicar coberturas, tiempos estimados, costos de envío,
            preparación de pedidos y cualquier condición logística relacionada con las entregas de Kowac.
          </p>
        </div>
      </div>
    </section>
  );
}

export const metadata = {
  title: "Órdenes | Kowac",
};

export default function OrdersPage() {
  return (
    <section className="simple-page">
      <div className="container">
        <div className="simple-page__box card-surface" style={{ display: "grid", gap: "1.1rem" }}>
          <span className="eyebrow">Ayuda</span>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "3rem" }}>
            Órdenes
          </h1>
          <p style={{ margin: 0, color: "var(--color-muted)", lineHeight: 1.8 }}>
            Esta página base queda creada para futuros módulos de seguimiento de pedidos, estados de
            orden, historial de compras y resolución de incidencias relacionadas con órdenes.
          </p>
        </div>
      </div>
    </section>
  );
}

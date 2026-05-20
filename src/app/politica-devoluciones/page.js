export const metadata = {
  title: "Política de devoluciones | Kowac",
};

export default function ReturnsPage() {
  return (
    <section className="simple-page">
      <div className="container">
        <div className="simple-page__box card-surface" style={{ display: "grid", gap: "1.1rem" }}>
          <span className="eyebrow">Normativas</span>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "3rem" }}>
            Política de devoluciones
          </h1>
          <p style={{ margin: 0, color: "var(--color-muted)", lineHeight: 1.8 }}>
            Esta página base servirá para definir condiciones de cambios, devoluciones, tiempos de
            revisión, estado del producto, costos logísticos y casos en los que aplica o no aplica una
            devolución en Kowac.
          </p>
          <p style={{ margin: 0, color: "var(--color-muted)", lineHeight: 1.8 }}>
            Por ahora queda creada la estructura para luego incorporar la política oficial aprobada por la
            marca.
          </p>
        </div>
      </div>
    </section>
  );
}

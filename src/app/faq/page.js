export const metadata = {
  title: "FAQ | Kowac",
};

export default function FaqPage() {
  return (
    <section className="simple-page">
      <div className="container">
        <div className="simple-page__box card-surface" style={{ display: "grid", gap: "1.1rem" }}>
          <span className="eyebrow">Ayuda</span>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "3rem" }}>
            Preguntas frecuentes
          </h1>
          <p style={{ margin: 0, color: "var(--color-muted)", lineHeight: 1.8 }}>
            Esta página base queda preparada para resolver dudas comunes sobre compras, tallas,
            pagos, envíos, cambios, devoluciones y tiempos de atención en Kowac.
          </p>
        </div>
      </div>
    </section>
  );
}

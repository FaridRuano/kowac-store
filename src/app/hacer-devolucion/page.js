export const metadata = {
  title: "Hacer una devolución | Kowac",
};

export default function StartReturnPage() {
  return (
    <section className="simple-page">
      <div className="container">
        <div className="simple-page__box card-surface" style={{ display: "grid", gap: "1.1rem" }}>
          <span className="eyebrow">Ayuda</span>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "3rem" }}>
            Hacer una devolución
          </h1>
          <p style={{ margin: 0, color: "var(--color-muted)", lineHeight: 1.8 }}>
            Esta página base está pensada para guiar al cliente paso a paso en el proceso de solicitud
            de cambio o devolución, incluyendo requisitos, tiempos y canal de contacto.
          </p>
        </div>
      </div>
    </section>
  );
}

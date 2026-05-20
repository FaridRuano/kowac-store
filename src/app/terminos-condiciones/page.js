export const metadata = {
  title: "Términos y condiciones | Kowac",
};

export default function TermsPage() {
  return (
    <section className="simple-page">
      <div className="container">
        <div className="simple-page__box card-surface" style={{ display: "grid", gap: "1.1rem" }}>
          <span className="eyebrow">Normativas</span>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "3rem" }}>
            Términos y condiciones
          </h1>
          <p style={{ margin: 0, color: "var(--color-muted)", lineHeight: 1.8 }}>
            Esta es una página base para los términos y condiciones de compra, uso del sitio, cuentas,
            disponibilidad de productos, precios, pagos y limitaciones aplicables a Kowac.
          </p>
          <p style={{ margin: 0, color: "var(--color-muted)", lineHeight: 1.8 }}>
            En la siguiente fase se puede completar con el texto legal definitivo y validado para la
            operación comercial de la marca.
          </p>
        </div>
      </div>
    </section>
  );
}

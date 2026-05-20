export const metadata = {
  title: "Política de privacidad | Kowac",
};

export default function PrivacyPage() {
  return (
    <section className="simple-page">
      <div className="container">
        <div className="simple-page__box card-surface" style={{ display: "grid", gap: "1.1rem" }}>
          <span className="eyebrow">Normativas</span>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "3rem" }}>
            Política de privacidad
          </h1>
          <p style={{ margin: 0, color: "var(--color-muted)", lineHeight: 1.8 }}>
            Esta página base servirá para documentar cómo Kowac recopila, usa, almacena y protege los
            datos personales de sus clientes y visitantes.
          </p>
          <p style={{ margin: 0, color: "var(--color-muted)", lineHeight: 1.8 }}>
            Cuando definan el texto final, aquí se puede incluir alcance, finalidades, derechos del
            titular y medios de contacto para solicitudes relacionadas con privacidad.
          </p>
        </div>
      </div>
    </section>
  );
}

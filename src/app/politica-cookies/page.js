export const metadata = {
  title: "Política de cookies | Kowac",
};

export default function CookiesPage() {
  return (
    <section className="simple-page">
      <div className="container">
        <div className="simple-page__box card-surface" style={{ display: "grid", gap: "1.1rem" }}>
          <span className="eyebrow">Normativas</span>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "3rem" }}>
            Política de cookies
          </h1>
          <p style={{ margin: 0, color: "var(--color-muted)", lineHeight: 1.8 }}>
            Esta sección queda preparada para explicar el uso de cookies, tecnologías de seguimiento,
            analítica, preferencias de navegación y consentimiento del usuario dentro del sitio de Kowac.
          </p>
          <p style={{ margin: 0, color: "var(--color-muted)", lineHeight: 1.8 }}>
            Más adelante se puede completar con el detalle técnico y legal según las herramientas que se
            activen en producción.
          </p>
        </div>
      </div>
    </section>
  );
}

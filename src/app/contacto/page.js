export const metadata = {
  title: "Contacto | Kowac",
};

export default function ContactPage() {
  return (
    <section className="simple-page">
      <div className="container">
        <div className="simple-page__box card-surface stack-md">
          <span className="eyebrow">Contacto</span>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "3rem" }}>
            Hablemos de Kowac
          </h1>
          <p className="text-muted" style={{ margin: 0 }}>
            Página base para futuros datos de atención, WhatsApp, redes y formulario de contacto.
          </p>
        </div>
      </div>
    </section>
  );
}

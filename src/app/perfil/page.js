export const metadata = {
  title: "Perfil | Kowac",
};

export default function ProfilePage() {
  return (
    <section className="simple-page">
      <div className="container">
        <div className="simple-page__box card-surface stack-md">
          <span className="eyebrow">Perfil</span>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "3rem" }}>
            Cuenta de usuario
          </h1>
          <p className="text-muted" style={{ margin: 0 }}>
            Página base para datos personales, direcciones, pedidos y preferencias del cliente.
          </p>
        </div>
      </div>
    </section>
  );
}

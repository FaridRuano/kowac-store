import Link from "next/link";

export const metadata = {
  title: "Página no encontrada | Kowac",
};

export default function NotFound() {
  return (
    <section className="not-found-page">
      <div className="container">
        <div className="not-found-page__content">
          <span className="eyebrow">404</span>
          <h1>No encontramos esta página</h1>
          <p>
            Puede que el enlace haya cambiado o que la dirección no exista.
          </p>
          <Link href="/" className="button-primary">
            Ir al inicio
          </Link>
        </div>
      </div>
    </section>
  );
}

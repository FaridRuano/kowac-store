export const metadata = {
  title: "Wishlist | Kowac",
};

export default function WishlistPage() {
  return (
    <section className="simple-page">
      <div className="container">
        <div className="simple-page__box card-surface stack-md">
          <span className="eyebrow">Wishlist</span>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "3rem" }}>
            Favoritos guardados
          </h1>
          <p className="text-muted" style={{ margin: 0 }}>
            Aquí vivirá la selección de productos que el usuario marque con like o corazón.
          </p>
        </div>
      </div>
    </section>
  );
}

import CartEmptyState from "@/components/cart/CartEmptyState";
import { dictionaries, defaultLanguage } from "@/lib/i18n/dictionaries";

export const metadata = {
  title: "Carrito | Kowac",
};

export default function CartPage() {
  const dictionary = dictionaries[defaultLanguage];

  return (
    <section className="simple-page">
      <div className="container stack-lg">
        <div className="stack-sm">
          <span className="eyebrow">Carrito</span>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "3.2rem" }}>
            Resumen de compra
          </h1>
        </div>

        <div className="card-surface" style={{ minHeight: "420px" }}>
          <CartEmptyState dictionary={dictionary} />
        </div>
      </div>
    </section>
  );
}

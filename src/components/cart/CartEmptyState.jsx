import { ShoppingBag } from "lucide-react";
import Link from "next/link";

import styles from "./CartEmptyState.module.scss";

export default function CartEmptyState({ dictionary, onNavigate }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.iconWrap} aria-hidden="true">
        <ShoppingBag size={34} strokeWidth={1.6} />
      </div>

      <div className={styles.copy}>
        <h2>{dictionary.cart.emptyTitle}</h2>
        <p>{dictionary.cart.emptyDescription}</p>
      </div>

      <div className={styles.actions}>
        <Link href="/zapatos" className="button-primary" onClick={onNavigate}>
          {dictionary.cart.shoesLink}
        </Link>
        <Link href="/ropa" className="button-secondary" onClick={onNavigate}>
          {dictionary.cart.apparelLink}
        </Link>
      </div>
    </div>
  );
}

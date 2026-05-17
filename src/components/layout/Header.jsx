import Link from "next/link";

import styles from "./Header.module.scss";

const navigation = [
  { href: "/", label: "Inicio" },
  { href: "/tienda", label: "Tienda" },
  { href: "/tienda?type=zapatos", label: "Zapatos" },
  { href: "/tienda?type=ropa", label: "Ropa" },
  { href: "/contacto", label: "Contacto" },
];

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          KOWAC
        </Link>

        <nav className={styles.nav} aria-label="Navegación principal">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className={styles.navLink}>
              {item.label}
            </Link>
          ))}
        </nav>

        <Link href="/carrito" className={styles.cartLink}>
          Carrito
        </Link>
      </div>
    </header>
  );
}

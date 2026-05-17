import styles from "./Footer.module.scss";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
          <p>Kowac. Moda ecuatoriana para caminar con carácter.</p>
          <p>Base e-commerce fase 1: storefront, modelos y API inicial.</p>
      </div>
    </footer>
  );
}

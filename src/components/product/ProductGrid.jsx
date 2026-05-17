import ProductCard from "./ProductCard";
import styles from "./ProductGrid.module.scss";

export default function ProductGrid({ products = [] }) {
  if (!products.length) {
    return (
      <div className={styles.empty}>
        Aún no hay productos cargados. Esta cuadrícula está lista para conectarse a MongoDB.
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCard key={product.slug || product._id} product={product} />
      ))}
    </div>
  );
}

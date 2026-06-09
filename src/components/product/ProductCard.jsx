/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import styles from "./ProductCard.module.scss";

function formatPrice(value) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

export default function ProductCard({ product }) {
  const image = product?.images?.[0] || product?.variants?.[0]?.images?.[0] || "";

  return (
    <Link href={`/producto/${product.slug}`} className={styles.card}>
      <div className={styles.media}>
        <div className={styles.badges}>
          {product?.isFeatured ? <span className={styles.badge}>Destacado</span> : null}
          {product?.isNewArrival ? <span className={styles.badge}>Nuevo</span> : null}
          {product?.isTrending ? <span className={styles.badge}>Tendencia</span> : null}
        </div>
        {image ? (
          <img src={image} alt={product.name} />
        ) : (
          <div className={styles.placeholder}>KOWAC</div>
        )}
      </div>

      <div className={styles.body}>
        <div className="stack-sm">
          <p className="text-muted" style={{ margin: 0 }}>
            {product.brand || "Kowac"}
          </p>
          <h3 className={styles.title}>{product.name}</h3>
        </div>

        <div className={styles.meta}>
          <span className={styles.price}>{formatPrice(product.price)}</span>
          {product.compareAtPrice ? (
            <span className={styles.compareAtPrice}>
              {formatPrice(product.compareAtPrice)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

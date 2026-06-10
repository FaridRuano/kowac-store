/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import FavoriteButton from "./FavoriteButton";
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
  const productId = product?._id || product?.id || "";

  return (
    <article className={styles.card}>
      <Link href={`/producto/${product.slug}`} className={styles.productLink}>
        <div className={styles.media}>
          {image ? (
            <img src={image} alt={product.name} />
          ) : (
            <div className={styles.placeholder}>KOWAC</div>
          )}
        </div>

        <div className={styles.body}>
          <h3 className={styles.title}>{product.name}</h3>

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

      {productId ? (
        <FavoriteButton productId={productId} productName={product.name} />
      ) : null}
    </article>
  );
}

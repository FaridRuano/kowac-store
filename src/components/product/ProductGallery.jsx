/* eslint-disable @next/next/no-img-element */
export default function ProductGallery({ images = [] }) {
  const primaryImage = images[0];

  return (
    <div className="card-surface" style={{ padding: "1.5rem" }}>
      {primaryImage ? (
        <img
          src={primaryImage}
          alt="Imagen principal del producto"
          style={{ width: "100%", borderRadius: "1rem", aspectRatio: "4 / 5", objectFit: "cover" }}
        />
      ) : (
        <div
          style={{
            minHeight: "420px",
            display: "grid",
            placeItems: "center",
            borderRadius: "1rem",
            background: "linear-gradient(135deg, rgba(216, 193, 160, 0.35), rgba(139, 94, 60, 0.2))",
            color: "var(--color-muted)",
          }}
        >
          Galería de producto
        </div>
      )}
    </div>
  );
}

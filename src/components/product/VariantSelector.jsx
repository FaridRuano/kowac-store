export default function VariantSelector({ variants = [] }) {
  return (
    <div className="card-surface" style={{ padding: "1.5rem" }}>
      <div className="stack-sm">
        <strong>Variantes</strong>
        <p className="text-muted" style={{ margin: 0 }}>
          La selección interactiva de talla y color se conectará en la siguiente fase.
        </p>
      </div>

      {!!variants.length && (
        <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          {variants.map((variant) => (
            <span
              key={`${variant.sku}-${variant.size}`}
              style={{
                padding: "0.7rem 0.95rem",
                borderRadius: "999px",
                border: "1px solid var(--color-border)",
                background: "rgba(255,255,255,0.7)",
              }}
            >
              {variant.colorName} / {variant.size}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

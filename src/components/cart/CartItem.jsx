export default function CartItem({ item }) {
  return (
    <article className="card-surface" style={{ padding: "1.25rem" }}>
      <div className="stack-sm">
        <strong>{item?.productName || "Producto en carrito"}</strong>
        <p className="text-muted" style={{ margin: 0 }}>
          SKU: {item?.sku || "Pendiente"} | Cantidad: {item?.quantity || 1}
        </p>
      </div>
    </article>
  );
}

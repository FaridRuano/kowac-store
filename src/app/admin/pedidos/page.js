export default function AdminOrdersPage() {
  return (
    <div className="card-surface" style={{ padding: "2rem" }}>
      <div className="stack-sm">
        <span className="eyebrow">Pedidos</span>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "2.4rem" }}>
          Gestión inicial de pedidos
        </h1>
        <p className="text-muted" style={{ margin: 0 }}>
          La API `/api/orders` ya está lista para soportar el siguiente paso del flujo de checkout.
        </p>
      </div>
    </div>
  );
}

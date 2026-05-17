export const metadata = {
  title: "Admin | Kowac",
};

export default function AdminPage() {
  return (
    <div className="card-surface" style={{ padding: "2rem" }}>
      <div className="stack-sm">
        <span className="eyebrow">Admin</span>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "2.8rem" }}>
          Panel base de administración
        </h1>
        <p className="text-muted" style={{ margin: 0 }}>
          Desde aquí crecerán catálogo, pedidos, clientes y control operativo del e-commerce.
        </p>
      </div>
    </div>
  );
}

import Link from "next/link";

const items = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/pedidos", label: "Pedidos" },
];

export default function AdminSidebar() {
  return (
    <aside className="card-surface" style={{ padding: "1.5rem" }}>
      <div className="stack-md">
        <div>
          <strong>Panel Kowac</strong>
          <p className="text-muted" style={{ margin: "0.5rem 0 0" }}>
            Gestión inicial del catálogo y operaciones.
          </p>
        </div>

        <nav aria-label="Navegación administrativa" className="stack-sm">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "block",
                padding: "0.85rem 1rem",
                borderRadius: "1rem",
                background: "rgba(255,255,255,0.7)",
                border: "1px solid var(--color-border)",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}

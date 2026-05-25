import { FolderTree, PackageSearch, Plus } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Catálogo | Admin Kowac",
};

const catalogActions = [
  {
    href: "/admin/catalogo/categorias",
    icon: FolderTree,
    title: "Categorías",
    description: "Organiza calzado y ropa en grupos visibles para tienda pública.",
  },
  {
    href: "/admin/catalogo/productos",
    icon: PackageSearch,
    title: "Productos",
    description: "Revisa el listado, estados, precios base y disponibilidad.",
  },
  {
    href: "/admin/catalogo/nuevo-producto",
    icon: Plus,
    title: "Nuevo producto",
    description: "Crea un producto con variantes, tallas, colores e imágenes.",
  },
];

export default function AdminCatalogPage() {
  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Catálogo</span>
          <h1>Inicio</h1>
          <p className="text-muted">
            Configura la base comercial de Kowac: categorías, productos, variantes y disponibilidad.
          </p>
        </div>
      </div>

      <div className="admin-action-grid">
        {catalogActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link key={action.href} href={action.href} className="admin-action-card">
              <Icon size={28} strokeWidth={1.7} aria-hidden="true" />
              <div>
                <strong>{action.title}</strong>
                <span>{action.description}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

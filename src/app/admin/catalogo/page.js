import {
  AlertTriangle,
  Boxes,
  EyeOff,
  FolderTree,
  PackageCheck,
  PackageSearch,
  Plus,
  Tags,
  Warehouse,
} from "lucide-react";
import Link from "next/link";

import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";
import ProductVariant from "@/models/ProductVariant";

export const metadata = {
  title: "Catálogo | Admin Kowac",
};

const lowStockLimit = 5;

const catalogActions = [
  {
    href: "/admin/catalogo/nuevo-producto",
    icon: Plus,
    title: "Nuevo producto",
    description: "Crea producto, variantes, tallas, colores e imágenes.",
  },
  {
    href: "/admin/catalogo/productos",
    icon: PackageSearch,
    title: "Productos",
    description: "Revisa estados, precios base y visibilidad pública.",
  },
  {
    href: "/admin/catalogo/variantes",
    icon: Warehouse,
    title: "Inventario",
    description: "Ajusta stock por talla, color y presentación.",
  },
  {
    href: "/admin/catalogo/categorias",
    icon: FolderTree,
    title: "Categorías",
    description: "Ordena ropa y calzado para la tienda pública.",
  },
];

function formatProductStatus(value) {
  const statuses = {
    active: "Activo",
    draft: "Borrador",
    inactive: "Inactivo",
  };

  return statuses[value] || value || "Sin estado";
}

function formatDate(value) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

async function getCatalogOverview() {
  await connectDB();

  const [
    totalProducts,
    visibleProducts,
    draftProducts,
    totalCategories,
    inactiveCategories,
    totalVariants,
    visibleVariants,
    lowStockVariants,
    outOfStockVariants,
    hiddenActiveVariants,
    stockSummary,
    categoryBreakdown,
    recentProducts,
  ] = await Promise.all([
    Product.countDocuments({}),
    Product.countDocuments({ status: "active", showInCatalog: true, isActive: true }),
    Product.countDocuments({ status: "draft" }),
    Category.countDocuments({}),
    Category.countDocuments({ isActive: false }),
    ProductVariant.countDocuments({ isActive: true }),
    ProductVariant.countDocuments({ status: "active", showInCatalog: true, isActive: true }),
    ProductVariant.countDocuments({ isActive: true, stock: { $gt: 0, $lte: lowStockLimit } }),
    ProductVariant.countDocuments({ isActive: true, stock: { $lte: 0 } }),
    ProductVariant.countDocuments({ status: "active", showInCatalog: false, isActive: true }),
    ProductVariant.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          stock: { $sum: "$stock" },
        },
      },
    ]),
    Product.aggregate([
      {
        $group: {
          _id: "$type",
          active: {
            $sum: {
              $cond: [{ $eq: ["$status", "active"] }, 1, 0],
            },
          },
          total: { $sum: 1 },
          visible: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "active"] },
                    { $eq: ["$showInCatalog", true] },
                    { $eq: ["$isActive", true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Product.find({})
      .select("name slug status showInCatalog updatedAt")
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean(),
  ]);

  return {
    categoryBreakdown: categoryBreakdown.map((item) => ({
      active: item.active,
      label: item._id === "ropa" ? "Ropa" : item._id === "zapatos" ? "Calzado" : "Sin tipo",
      total: item.total,
      visible: item.visible,
    })),
    metrics: [
      {
        icon: PackageCheck,
        label: "Productos visibles",
        value: visibleProducts,
        helper: `${totalProducts} producto(s) registrados`,
      },
      {
        icon: Boxes,
        label: "Variantes visibles",
        value: visibleVariants,
        helper: `${totalVariants} variante(s) activas`,
      },
      {
        icon: Tags,
        label: "Categorías",
        value: totalCategories,
        helper: inactiveCategories ? `${inactiveCategories} inactiva(s)` : "Todas activas",
      },
      {
        icon: Warehouse,
        label: "Stock disponible",
        value: stockSummary[0]?.stock || 0,
        helper: "Unidades activas en inventario",
      },
    ],
    recentProducts: recentProducts.map((product) => ({
      href: `/admin/catalogo/productos/${product._id.toString()}`,
      id: product._id.toString(),
      name: product.name,
      showInCatalog: product.showInCatalog,
      status: product.status,
      updatedAt: product.updatedAt,
    })),
    tasks: [
      {
        count: draftProducts,
        href: "/admin/catalogo/productos",
        icon: AlertTriangle,
        label: "Productos en borrador",
        tone: draftProducts ? "warning" : "success",
      },
      {
        count: lowStockVariants,
        href: "/admin/catalogo/variantes",
        icon: AlertTriangle,
        label: `Variantes con 1 a ${lowStockLimit} unidades`,
        tone: lowStockVariants ? "warning" : "success",
      },
      {
        count: outOfStockVariants,
        href: "/admin/catalogo/variantes",
        icon: Warehouse,
        label: "Variantes sin stock",
        tone: outOfStockVariants ? "warning" : "success",
      },
      {
        count: hiddenActiveVariants,
        href: "/admin/catalogo/variantes",
        icon: EyeOff,
        label: "Variantes activas ocultas",
        tone: hiddenActiveVariants ? "muted" : "success",
      },
    ],
  };
}

export default async function AdminCatalogPage() {
  const overview = await getCatalogOverview();

  return (
    <div className="admin-page admin-catalog-home">
      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Catálogo</span>
          <h1>Inicio</h1>
          <p className="text-muted">
            Lectura rápida de productos, categorías, variantes y pendientes que afectan la tienda pública.
          </p>
        </div>
        <Link href="/admin/catalogo/nuevo-producto" className="admin-page__action-pill">
          Nuevo producto
        </Link>
      </div>

      <section className="admin-catalog-metrics" aria-label="Resumen del catálogo">
        {overview.metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <article key={metric.label} className="admin-catalog-metric">
              <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
              <div>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.helper}</small>
              </div>
            </article>
          );
        })}
      </section>

      <section className="admin-action-grid admin-action-grid--catalog" aria-label="Accesos rápidos de catálogo">
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
      </section>

      <section className="admin-catalog-dashboard" aria-label="Estado operativo del catálogo">
        <div className="admin-catalog-panel">
          <div className="admin-catalog-panel__header">
            <div>
              <span className="eyebrow">Pendientes</span>
              <h2>Revisiones rápidas</h2>
            </div>
          </div>

          <div className="admin-catalog-task-list">
            {overview.tasks.map((task) => {
              const Icon = task.icon;

              return (
                <Link key={task.label} href={task.href} className="admin-catalog-task">
                  <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                  <span>{task.label}</span>
                  <strong className={`admin-catalog-task__count admin-catalog-task__count--${task.tone}`}>
                    {task.count}
                  </strong>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="admin-catalog-panel">
          <div className="admin-catalog-panel__header">
            <div>
              <span className="eyebrow">Actividad</span>
              <h2>Productos recientes</h2>
            </div>
            <Link href="/admin/catalogo/productos" className="admin-catalog-panel__link">
              Ver todos
            </Link>
          </div>

          {overview.recentProducts.length ? (
            <div className="admin-catalog-recent-list">
              {overview.recentProducts.map((product) => (
                <Link key={product.id} href={product.href} className="admin-catalog-recent">
                  <div>
                    <strong>{product.name}</strong>
                    <span>{formatDate(product.updatedAt)}</span>
                  </div>
                  <span className={`admin-page__status ${product.status === "active" ? "admin-page__status--success" : "admin-page__status--muted"}`}>
                    {product.showInCatalog ? "Visible" : formatProductStatus(product.status)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="admin-page__empty admin-catalog-panel__empty">
              <strong>No hay productos todavía.</strong>
              <span>Crea el primer producto para empezar a poblar el catálogo.</span>
            </div>
          )}
        </div>
      </section>

      <section className="admin-catalog-panel" aria-label="Distribución por tipo de producto">
        <div className="admin-catalog-panel__header">
          <div>
            <span className="eyebrow">Composición</span>
            <h2>Productos por tipo</h2>
          </div>
        </div>

        {overview.categoryBreakdown.length ? (
          <div className="admin-catalog-breakdown">
            {overview.categoryBreakdown.map((item) => (
              <div key={item.label} className="admin-catalog-breakdown__row">
                <strong>{item.label}</strong>
                <span>{item.visible} visibles</span>
                <span>{item.active} activos</span>
                <span>{item.total} total</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-page__empty admin-catalog-panel__empty">
            <strong>No hay productos clasificados.</strong>
            <span>Cuando existan productos, este resumen separará ropa y calzado.</span>
          </div>
        )}
      </section>
    </div>
  );
}

import { Expand, Pencil } from "lucide-react";
import Link from "next/link";

import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import ProductVariant from "@/models/ProductVariant";

export const metadata = {
  title: "Productos | Admin Kowac",
};

function formatPrice(value) {
  return new Intl.NumberFormat("es-EC", {
    currency: "USD",
    style: "currency",
  }).format(value || 0);
}

function formatProductStatus(value) {
  const statuses = {
    active: "Activo",
    draft: "Borrador",
    inactive: "Inactivo",
  };

  return statuses[value] || value || "Sin estado";
}

function formatProductType(value) {
  const types = {
    ropa: "Ropa",
    zapatos: "Calzado",
  };

  return types[value] || value || "Sin tipo";
}

async function getProducts() {
  await connectDB();

  const products = await Product.find({})
    .select("name slug type basePrice price showInCatalog status isActive updatedAt")
    .sort({ updatedAt: -1 })
    .lean();
  const variantCounts = await ProductVariant.aggregate([
    {
      $match: {
        product: { $in: products.map((product) => product._id) },
        isActive: true,
      },
    },
    {
      $group: {
        _id: "$product",
        count: { $sum: 1 },
      },
    },
  ]);
  const countsByProductId = new Map(
    variantCounts.map((item) => [item._id.toString(), item.count])
  );

  return products.map((product) => ({
    id: product._id.toString(),
    name: product.name,
    price: product.basePrice || product.price,
    slug: product.slug,
    status: product.status || (product.isActive ? "active" : "inactive"),
    showInCatalog: product.showInCatalog,
    type: product.type,
    variantsCount: countsByProductId.get(product._id.toString()) || 0,
  }));
}

export default async function AdminCatalogProductsPage() {
  const products = await getProducts();

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Catálogo</span>
          <h1>Productos</h1>
          <p className="text-muted">
            Listado base para consultar productos, estado comercial y cantidad de variantes.
          </p>
        </div>
        <Link href="/admin/catalogo/nuevo-producto" className="admin-page__action-pill">
          Nuevo producto
        </Link>
      </div>

      {products.length ? (
        <div className="admin-page__table-wrap">
          <table className="admin-page__table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Precio base</th>
                <th>Variantes</th>
                <th>Catálogo</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="admin-page__primary-cell">
                    <strong>{product.name}</strong>
                    <span>{product.slug}</span>
                  </td>
                  <td>{formatProductType(product.type)}</td>
                  <td>{formatPrice(product.price)}</td>
                  <td>{product.variantsCount}</td>
                  <td>{product.showInCatalog ? "Visible" : "Oculto"}</td>
                  <td>
                    <span className={`admin-page__status ${product.status === "active" ? "admin-page__status--success" : "admin-page__status--muted"}`}>
                      {formatProductStatus(product.status)}
                    </span>
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      <Link
                        href={`/admin/catalogo/productos/${product.id}`}
                        className="admin-table-icon-link"
                        aria-label={`Abrir ${product.name}`}
                        title="Abrir producto"
                      >
                        <Expand size={15} strokeWidth={1.9} aria-hidden="true" />
                      </Link>
                      <Link
                        href={`/admin/catalogo/nuevo-producto?editar=${product.id}`}
                        className="admin-table-icon-link"
                        aria-label={`Editar ${product.name}`}
                        title="Editar producto"
                      >
                        <Pencil size={15} strokeWidth={1.9} aria-hidden="true" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-page__empty">
          <strong>No hay productos registrados.</strong>
          <span>Cuando creemos el primer producto aparecerá en este listado.</span>
        </div>
      )}
    </div>
  );
}

import Link from "next/link";

import { connectDB } from "@/lib/db";
import Product from "@/models/Product";

export const metadata = {
  title: "Productos | Admin Kowac",
};

function formatPrice(value) {
  return new Intl.NumberFormat("es-EC", {
    currency: "USD",
    style: "currency",
  }).format(value || 0);
}

async function getProducts() {
  await connectDB();

  const products = await Product.find({})
    .select("name slug type price variants isActive updatedAt")
    .sort({ updatedAt: -1 })
    .lean();

  return products.map((product) => ({
    id: product._id.toString(),
    name: product.name,
    price: product.price,
    slug: product.slug,
    status: product.isActive ? "Activo" : "Inactivo",
    type: product.type,
    variantsCount: product.variants?.length || 0,
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
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="admin-page__primary-cell">
                    <strong>{product.name}</strong>
                    <span>{product.slug}</span>
                  </td>
                  <td>{product.type}</td>
                  <td>{formatPrice(product.price)}</td>
                  <td>{product.variantsCount}</td>
                  <td>
                    <span className={`admin-page__status ${product.status === "Activo" ? "admin-page__status--success" : "admin-page__status--muted"}`}>
                      {product.status}
                    </span>
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

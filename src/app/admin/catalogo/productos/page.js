import { Expand, Pencil } from "lucide-react";
import { isValidObjectId } from "mongoose";
import Link from "next/link";

import ProductCatalogControls from "@/components/admin/ProductCatalogControls";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";
import ProductVariant from "@/models/ProductVariant";

const PRODUCTS_PER_PAGE = 8;

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

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeSearchParams(searchParams = {}) {
  const rawPage = Number.parseInt(Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page, 10);

  return {
    category: String(Array.isArray(searchParams.category) ? searchParams.category[0] : searchParams.category || "").trim(),
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
    q: String(Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q || "").trim(),
  };
}

function buildProductFilters({ category, q }) {
  const filters = {};

  if (category && isValidObjectId(category)) {
    filters.category = category;
  }

  if (q) {
    const searchRegex = new RegExp(escapeRegex(q), "i");
    filters.$or = [
      { name: searchRegex },
      { slug: searchRegex },
      { type: searchRegex },
      { status: searchRegex },
    ];
  }

  return filters;
}

async function getProductCategories() {
  await connectDB();

  const categories = await Category.find({})
    .select("name slug type isActive")
    .sort({ type: 1, name: 1 })
    .lean();

  return categories.map((category) => ({
    id: category._id.toString(),
    name: `${category.name}${category.isActive ? "" : " (inactiva)"}`,
    slug: category.slug,
    type: category.type,
  }));
}

async function getProducts({ category, page, q }) {
  await connectDB();

  const filters = buildProductFilters({ category, q });
  const totalProducts = await Product.countDocuments(filters);
  const totalPages = Math.max(1, Math.ceil(totalProducts / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const products = await Product.find(filters)
    .select("name slug type basePrice price showInCatalog status isActive updatedAt")
    .sort({ updatedAt: -1 })
    .skip((currentPage - 1) * PRODUCTS_PER_PAGE)
    .limit(PRODUCTS_PER_PAGE)
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

  return {
    currentPage,
    products: products.map((product) => ({
      id: product._id.toString(),
      name: product.name,
      price: product.basePrice || product.price,
      slug: product.slug,
      status: product.status || (product.isActive ? "active" : "inactive"),
      showInCatalog: product.showInCatalog,
      type: product.type,
      variantsCount: countsByProductId.get(product._id.toString()) || 0,
    })),
    totalPages,
    totalProducts,
  };
}

export default async function AdminCatalogProductsPage({ searchParams }) {
  const params = normalizeSearchParams(await searchParams);
  const [categories, productResult] = await Promise.all([
    getProductCategories(),
    getProducts(params),
  ]);
  const { currentPage, products, totalPages, totalProducts } = productResult;

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Catálogo</span>
          <h1>Productos</h1>
          <p className="text-muted">
            Listado base para consultar productos, estado comercial y cantidad de variantes. Máximo 8 por página.
          </p>
        </div>
        <Link href="/admin/catalogo/nuevo-producto" className="admin-page__action-pill">
          Nuevo producto
        </Link>
      </div>

      <ProductCatalogControls
        key={`${params.category}:${params.q}`}
        categories={categories}
        currentCategory={params.category}
        currentPage={currentPage}
        currentQuery={params.q}
        totalPages={totalPages}
      />

      <div className="admin-product-list-summary">
        <span>{totalProducts} producto(s) encontrado(s)</span>
        <span>Mostrando {products.length} de {PRODUCTS_PER_PAGE}</span>
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
                        className="admin-icon-button admin-icon-button--secondary admin-table-icon-link"
                        aria-label={`Abrir ${product.name}`}
                        title="Abrir producto"
                      >
                        <Expand size={15} strokeWidth={1.9} aria-hidden="true" />
                      </Link>
                      <Link
                        href={`/admin/catalogo/nuevo-producto?editar=${product.id}`}
                        className="admin-icon-button admin-icon-button--secondary admin-table-icon-link"
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
          <strong>No encontramos productos.</strong>
          <span>Ajusta la búsqueda o limpia los filtros para volver al listado completo.</span>
        </div>
      )}
    </div>
  );
}

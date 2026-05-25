import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";

export async function generateMetadata({ params }) {
  const { categorySlug } = await params;
  const category = await getCategory(categorySlug);

  return {
    title: category ? `${category.name} | Catálogo Kowac` : "Categoría | Admin Kowac",
  };
}

function formatPrice(value) {
  return new Intl.NumberFormat("es-EC", {
    currency: "USD",
    style: "currency",
  }).format(value || 0);
}

async function getCategory(categorySlug) {
  await connectDB();

  const category = await Category.findOne({ slug: categorySlug })
    .select("name slug description type isActive")
    .lean();

  if (!category) {
    return null;
  }

  return {
    description: category.description,
    id: category._id.toString(),
    name: category.name,
    slug: category.slug,
    status: category.isActive ? "Activa" : "Inactiva",
    type: category.type,
  };
}

async function getProductsByCategory(categoryId) {
  const products = await Product.find({ category: categoryId })
    .select("name slug type price images variants isActive")
    .sort({ name: 1 })
    .lean();

  return products.map((product) => {
    const images = [
      ...(product.images || []),
      ...(product.variants || []).flatMap((variant) => variant.images || []),
    ].filter(Boolean);

    return {
      id: product._id.toString(),
      images,
      name: product.name,
      price: product.price,
      slug: product.slug,
      status: product.isActive ? "Activo" : "Inactivo",
      type: product.type,
      variantsCount: product.variants?.length || 0,
    };
  });
}

export default async function AdminCatalogCategoryProductsPage({ params }) {
  const { categorySlug } = await params;
  const category = await getCategory(categorySlug);

  if (!category) {
    notFound();
  }

  const products = await getProductsByCategory(category.id);

  return (
    <div className="admin-page">
      <Link href="/admin/catalogo/categorias" className="admin-page__action-pill admin-page__back-link">
        <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
        Volver
      </Link>

      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Categoría</span>
          <h1>{category.name}</h1>
          <p className="text-muted">
            Productos asignados a esta categoría. Las cards ya contemplan productos con una o varias imágenes.
          </p>
        </div>
      </div>

      <div className="admin-category-detail__summary">
        <span>{category.type}</span>
        <span>{category.slug}</span>
        <span>{products.length} producto(s)</span>
        <span className={`admin-page__status ${category.status === "Activa" ? "admin-page__status--success" : "admin-page__status--muted"}`}>
          {category.status}
        </span>
      </div>

      {products.length ? (
        <div className="admin-category-products__grid">
          {products.map((product) => (
            <article key={product.id} className="admin-category-product-card">
              <div
                className="admin-category-product-card__media"
                style={product.images[0] ? { backgroundImage: `url(${product.images[0]})` } : undefined}
              >
                {product.images[0] ? null : <span>{product.name.slice(0, 2).toUpperCase()}</span>}
              </div>

              <div className="admin-category-product-card__content">
                <strong>{product.name}</strong>
                <span>{product.slug}</span>
              </div>

              <div className="admin-category-product-card__meta">
                <span>{formatPrice(product.price)}</span>
                <span>{product.variantsCount} variante(s)</span>
                <span>{product.images.length} imagen(es)</span>
                <span className={`admin-page__status ${product.status === "Activo" ? "admin-page__status--success" : "admin-page__status--muted"}`}>
                  {product.status}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="admin-page__empty">
          <strong>Sin productos en esta categoría.</strong>
          <span>Cuando asignes productos a {category.name}, aparecerán aquí en formato de card.</span>
        </div>
      )}
    </div>
  );
}

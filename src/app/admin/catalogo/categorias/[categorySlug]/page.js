import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";
import ProductVariant from "@/models/ProductVariant";

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
    .select("name slug type basePrice price showInCatalog status isActive mediaGroups")
    .sort({ name: 1 })
    .lean();
  const productIds = products.map((product) => product._id);
  const variants = productIds.length
    ? await ProductVariant.find({ product: { $in: productIds }, isActive: true })
      .select("product optionValues updatedAt")
      .sort({ updatedAt: -1 })
      .lean()
    : [];
  const variantsByProductId = new Map();

  variants.forEach((variant) => {
    const productId = variant.product?.toString();

    if (!productId) {
      return;
    }

    variantsByProductId.set(productId, [...(variantsByProductId.get(productId) || []), variant]);
  });

  return products.map((product) => {
    const productId = product._id.toString();
    const productVariants = variantsByProductId.get(productId) || [];
    const colorValues = productVariants
      .map((variant) => {
        if (variant.optionValues?.get) {
          return variant.optionValues.get("color") || "";
        }

        return variant.optionValues?.color || "";
      })
      .filter(Boolean);
    const mediaGroup = (product.mediaGroups || []).find((group) =>
      group.optionKey === "color" && colorValues.includes(group.optionValue)
    ) || (product.mediaGroups || []).find((group) =>
      group.optionKey === "color" && group.media?.some((media) => media.type === "image" && (media.secureUrl || media.url))
    );
    const mediaUrls = (mediaGroup?.media || [])
      .filter((media) => media.type === "image" && (media.secureUrl || media.url))
      .sort((firstMedia, secondMedia) =>
        Number(secondMedia.isPrimary) - Number(firstMedia.isPrimary) ||
        Number(secondMedia.isSecondary) - Number(firstMedia.isSecondary) ||
        Number(secondMedia.isFeatured) - Number(firstMedia.isFeatured) ||
        (firstMedia.sortOrder || 0) - (secondMedia.sortOrder || 0)
      )
      .map((media) => media.secureUrl || media.url);

    return {
      id: productId,
      images: mediaUrls,
      name: product.name,
      price: product.basePrice || product.price,
      slug: product.slug,
      status: product.status || (product.isActive ? "active" : "inactive"),
      showInCatalog: product.showInCatalog,
      type: product.type,
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
                {product.images[0] ? null : (
                  <span>
                    <strong>KOWAC</strong>
                    <small>Imagen pendiente</small>
                  </span>
                )}
              </div>

              <div className="admin-category-product-card__content">
                <strong>{product.name}</strong>
                <span>{formatProductType(product.type)}</span>
              </div>

              <div className="admin-category-product-card__meta">
                <span>{formatPrice(product.price)}</span>
                <span>{product.showInCatalog ? "Visible" : "Oculto"}</span>
                <span className={`admin-page__status ${product.status === "active" ? "admin-page__status--success" : "admin-page__status--muted"}`}>
                  {formatProductStatus(product.status)}
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

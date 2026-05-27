import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";

import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import ProductOptionsManager from "@/components/admin/ProductOptionsManager";
import ProductVariant from "@/models/ProductVariant";

export async function generateMetadata({ params }) {
  const { productId } = await params;
  const product = await getProduct(productId);

  return {
    title: product ? `${product.name} | Producto Kowac` : "Producto | Admin Kowac",
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

function buildLookup(value) {
  return isValidObjectId(value) ? { _id: value } : { slug: value };
}

function countConfiguredVariants(product) {
  if (product.variants?.length) {
    return product.variants.length;
  }

  const sizesCount = product.options?.find((option) => option.key === "size")?.values?.length || 0;
  const colorsCount = product.options?.find((option) => option.key === "color")?.values?.length || 0;

  if (sizesCount && colorsCount) {
    return sizesCount * colorsCount;
  }

  return sizesCount || colorsCount;
}

async function getProduct(productId) {
  await connectDB();

  const product = await Product.findOne(buildLookup(productId))
    .populate("category", "name slug")
    .select("name slug type category baseCost basePrice price status showInCatalog options variants shortDescription description updatedAt")
    .lean();

  if (!product) {
    return null;
  }

  const realVariantsCount = await ProductVariant.countDocuments({
    product: product._id,
    isActive: true,
  });

  return {
    baseCost: product.baseCost || 0,
    basePrice: product.basePrice || product.price || 0,
    category: product.category?.name || "Sin categoría",
    description: product.description || "",
    id: product._id.toString(),
    name: product.name,
    options: (product.options || []).map((option) => ({
      key: option.key,
      label: option.label,
      values: (option.values || []).map((value) => ({
        hex: value.hex || "",
        label: value.label,
        value: value.value,
      })),
    })),
    shortDescription: product.shortDescription || "",
    showInCatalog: product.showInCatalog,
    slug: product.slug,
    status: product.status || "draft",
    type: formatProductType(product.type),
    variantsCount: realVariantsCount || countConfiguredVariants(product),
  };
}

export default async function AdminCatalogProductDetailPage({ params }) {
  const { productId } = await params;
  const product = await getProduct(productId);

  if (!product) {
    notFound();
  }

  return (
    <div className="admin-page">
      <Link href="/admin/catalogo/productos" className="admin-page__action-pill admin-page__back-link">
        <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
        Volver
      </Link>

      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Producto</span>
          <h1>{product.name}</h1>
          <p className="text-muted">
            Administra la información base del producto. Aquí agregaremos variantes, media y ajustes por variante.
          </p>
        </div>
        <span className={`admin-page__status ${product.status === "active" ? "admin-page__status--success" : "admin-page__status--muted"}`}>
          {formatProductStatus(product.status)}
        </span>
      </div>

      <div className="admin-product-detail__summary">
        <span>{product.type}</span>
        <span>{product.category}</span>
        <span>{product.showInCatalog ? "Visible en catálogo" : "Oculto en catálogo"}</span>
        <span>{product.variantsCount} variante(s)</span>
      </div>

      <div className="admin-product-detail__actions">
        <Link href={`/admin/catalogo/nuevo-producto?editar=${product.id}`} className="admin-product-detail__action">
          <Pencil size={16} strokeWidth={1.9} aria-hidden="true" />
          Editar producto
        </Link>
      </div>

      <div className="admin-product-detail__grid">
        <section className="admin-product-detail__panel">
          <span className="eyebrow">Precios</span>
          <dl>
            <div>
              <dt>Costo base</dt>
              <dd>{formatPrice(product.baseCost)}</dd>
            </div>
            <div>
              <dt>Precio de venta</dt>
              <dd>{formatPrice(product.basePrice)}</dd>
            </div>
          </dl>
        </section>

        <section className="admin-product-detail__panel">
          <span className="eyebrow">Contenido</span>
          <dl>
            <div>
              <dt>Slug</dt>
              <dd>{product.slug}</dd>
            </div>
            <div>
              <dt>Descripción corta</dt>
              <dd>{product.shortDescription || "Sin descripción corta"}</dd>
            </div>
          </dl>
        </section>
      </div>

      <ProductOptionsManager productId={product.id} productName={product.name} options={product.options} />
    </div>
  );
}

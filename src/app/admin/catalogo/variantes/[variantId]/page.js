import { ArrowLeft } from "lucide-react";
import { isValidObjectId } from "mongoose";
import Link from "next/link";
import { notFound } from "next/navigation";

import VariantInventoryForm from "@/components/admin/VariantInventoryForm";
import { connectDB } from "@/lib/db";
import "@/models/Category";
import "@/models/Product";
import ProductVariant from "@/models/ProductVariant";

export async function generateMetadata({ params }) {
  const { variantId } = await params;
  const variant = await getVariant(variantId);

  return {
    title: variant ? `${variant.name} | Inventario Kowac` : "Inventario | Admin Kowac",
  };
}

function buildLookup(value) {
  return isValidObjectId(value) ? { _id: value } : { sku: value };
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-EC", {
    currency: "USD",
    style: "currency",
  }).format(value || 0);
}

function formatVariantStatus(value) {
  const statuses = {
    active: "Activo",
    draft: "Borrador",
    inactive: "Inactivo",
  };

  return statuses[value] || value || "Sin estado";
}

async function getVariant(variantId) {
  await connectDB();

  const variant = await ProductVariant.findOne(buildLookup(variantId))
    .populate("product", "name slug")
    .populate("category", "name slug")
    .lean();

  if (!variant) {
    return null;
  }

  return {
    category: variant.category?.name || "Sin categoría",
    colorHex: variant.colorHex || "",
    colorName: variant.colorName || "Sin color",
    compareAtPrice: variant.compareAtPrice,
    cost: variant.cost || 0,
    discount: {
      isActive: Boolean(variant.discount?.isActive),
      type: variant.discount?.type || "none",
      value: variant.discount?.value || 0,
    },
    id: variant._id.toString(),
    isFeatured: Boolean(variant.isFeatured),
    isNewArrival: Boolean(variant.isNewArrival),
    isTrending: Boolean(variant.isTrending),
    name: variant.name,
    price: variant.price || 0,
    productHref: variant.product?._id ? `/admin/catalogo/productos/${variant.product._id.toString()}` : "",
    productName: variant.product?.name || variant.baseProductName,
    reservedStock: variant.reservedStock || 0,
    showInCatalog: Boolean(variant.showInCatalog),
    size: variant.size || "Sin talla",
    sku: variant.sku,
    status: variant.status || "draft",
    stock: variant.stock || 0,
  };
}

export default async function AdminCatalogVariantDetailPage({ params }) {
  const { variantId } = await params;
  const variant = await getVariant(variantId);

  if (!variant) {
    notFound();
  }

  return (
    <div className="admin-page">
      <Link href="/admin/catalogo/variantes" className="admin-page__action-pill admin-page__back-link">
        <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
        Volver
      </Link>

      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Inventario</span>
          <h1>{variant.name}</h1>
          <p className="text-muted">
            Administra stock, precio y visibilidad. Las imágenes se comparten por color desde la ficha del producto.
          </p>
        </div>
        <span className={`admin-page__status ${variant.status === "active" ? "admin-page__status--success" : "admin-page__status--muted"}`}>
          {formatVariantStatus(variant.status)}
        </span>
      </div>

      <div className="admin-product-detail__summary">
        <span>{variant.sku}</span>
        <span>{variant.productName}</span>
        <span>{variant.category}</span>
        <span>{variant.size}</span>
        <span>{variant.colorName}</span>
      </div>

      <div className="admin-product-detail__grid">
        <section className="admin-product-detail__panel">
          <span className="eyebrow">Stock</span>
          <dl>
            <div>
              <dt>Disponible</dt>
              <dd>{variant.stock}</dd>
            </div>
            <div>
              <dt>Reservado</dt>
              <dd>{variant.reservedStock}</dd>
            </div>
          </dl>
        </section>

        <section className="admin-product-detail__panel">
          <span className="eyebrow">Precio</span>
          <dl>
            <div>
              <dt>Precio</dt>
              <dd>{formatMoney(variant.price)}</dd>
            </div>
            <div>
              <dt>Costo</dt>
              <dd>{formatMoney(variant.cost)}</dd>
            </div>
          </dl>
        </section>
      </div>

      <VariantInventoryForm variant={variant} />
    </div>
  );
}

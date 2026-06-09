import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";

import { connectDB } from "@/lib/db";
import "@/models/Category";
import Product from "@/models/Product";
import ProductColorMediaManager from "@/components/admin/ProductColorMediaManager";
import ProductOptionsManager from "@/components/admin/ProductOptionsManager";
import ProductRealVariantsTable from "@/components/admin/ProductRealVariantsTable";
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

function formatApparelFit(value) {
  const fits = {
    fit: "Fit",
    normal: "Normal",
    oversize: "Oversize",
  };

  return fits[value] || "Sin corte";
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

function serializeMedia(mediaItems = []) {
  return mediaItems
    .map((media) => ({
      alt: media.alt || "",
      bytes: media.bytes || null,
      format: media.format || "",
      height: media.height || null,
      isFeatured: Boolean(media.isFeatured),
      isPrimary: Boolean(media.isPrimary),
      isSecondary: Boolean(media.isSecondary),
      publicId: media.publicId || media.storageKey || "",
      secureUrl: media.secureUrl || media.url || "",
      sortOrder: media.sortOrder || 0,
      url: media.url || media.secureUrl || "",
      width: media.width || null,
    }))
    .slice()
    .sort((firstMedia, secondMedia) =>
      Number(secondMedia.isPrimary) - Number(firstMedia.isPrimary) ||
      Number(secondMedia.isSecondary) - Number(firstMedia.isSecondary) ||
      Number(secondMedia.isFeatured) - Number(firstMedia.isFeatured) ||
      (firstMedia.sortOrder || 0) - (secondMedia.sortOrder || 0)
    );
}

function getColorValueFromVariant(variant) {
  if (variant.optionValues?.get) {
    return variant.optionValues.get("color") || "";
  }

  return variant.optionValues?.color || "";
}

function getColorImage(mediaGroups, colorValue, fallbackAlt) {
  const mediaGroup = mediaGroups.find((group) => group.optionKey === "color" && group.optionValue === colorValue);
  const primaryMedia = mediaGroup?.media?.[0] || null;

  return {
    alt: primaryMedia?.alt || fallbackAlt,
    url: primaryMedia?.secureUrl || primaryMedia?.url || "",
  };
}

async function getProduct(productId) {
  await connectDB();

  const product = await Product.findOne(buildLookup(productId))
    .populate("category", "name slug")
    .select("name slug type apparelFit category baseCost basePrice price status showInCatalog options variants mediaGroups shortDescription description updatedAt")
    .lean();

  if (!product) {
    return null;
  }

  const realVariants = await ProductVariant.find({
    product: product._id,
    isActive: true,
  })
    .select("name sku size colorName colorHex stock price status showInCatalog optionValues optionSignature updatedAt")
    .sort({ size: 1, colorName: 1, updatedAt: -1 })
    .lean();
  const mediaGroups = (product.mediaGroups || []).map((group) => ({
    label: group.label || "",
    media: serializeMedia(group.media || []),
    optionKey: group.optionKey,
    optionValue: group.optionValue,
  }));

  return {
    baseCost: product.baseCost || 0,
    basePrice: product.basePrice || product.price || 0,
    apparelFit: product.apparelFit || "",
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
    mediaGroups,
    shortDescription: product.shortDescription || "",
    showInCatalog: product.showInCatalog,
    slug: product.slug,
    status: product.status || "draft",
    rawType: product.type,
    type: formatProductType(product.type),
    variants: realVariants.map((variant) => {
      const colorValue = getColorValueFromVariant(variant);
      const primaryImage = getColorImage(
        mediaGroups,
        colorValue,
        variant.name
      );

      return {
        colorHex: variant.colorHex || "",
        colorName: variant.colorName || "",
        id: variant._id.toString(),
        imageAlt: primaryImage.alt,
        name: variant.name,
        optionSignature: variant.optionSignature,
        price: variant.price || 0,
        primaryImage: primaryImage.url,
        showInCatalog: Boolean(variant.showInCatalog),
        size: variant.size || "",
        sku: variant.sku,
        status: variant.status || "draft",
        stock: variant.stock || 0,
      };
    }),
    variantsCount: realVariants.length || countConfiguredVariants(product),
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
            Administra la información base del producto. Las imágenes se gestionan por color y se comparten entre sus tallas.
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
            {product.rawType === "ropa" ? (
              <div>
                <dt>Corte</dt>
                <dd>{formatApparelFit(product.apparelFit)}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      </div>

      <ProductOptionsManager
        existingVariantSignatures={product.variants.map((variant) => variant.optionSignature).filter(Boolean)}
        productId={product.id}
        productName={product.name}
        options={product.options}
      />
      <ProductColorMediaManager
        colors={product.options.find((option) => option.key === "color")?.values || []}
        mediaGroups={product.mediaGroups}
        productId={product.id}
        productName={product.name}
      />
      <ProductRealVariantsTable variants={product.variants} />
    </div>
  );
}

import { isValidObjectId } from "mongoose";

import InventoryCatalogControls from "@/components/admin/InventoryCatalogControls";
import InventoryTable from "@/components/admin/InventoryTable";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import "@/models/Product";
import ProductVariant from "@/models/ProductVariant";

const VARIANTS_PER_PAGE = 8;

export const metadata = {
  title: "Inventario | Admin Kowac",
};

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

function buildVariantFilters({ category, q }) {
  const filters = { isActive: true };

  if (category && isValidObjectId(category)) {
    filters.category = category;
  }

  if (q) {
    const searchRegex = new RegExp(escapeRegex(q), "i");

    filters.$or = [
      { name: searchRegex },
      { baseProductName: searchRegex },
      { sku: searchRegex },
    ];
  }

  return filters;
}

async function getInventoryCategories() {
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

async function getVariants({ category, page, q }) {
  await connectDB();

  const filters = buildVariantFilters({ category, q });
  const totalVariants = await ProductVariant.countDocuments(filters);
  const totalPages = Math.max(1, Math.ceil(totalVariants / VARIANTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const variants = await ProductVariant.find(filters)
    .populate("product", "name slug")
    .populate("category", "name slug")
    .sort({ updatedAt: -1 })
    .skip((currentPage - 1) * VARIANTS_PER_PAGE)
    .limit(VARIANTS_PER_PAGE)
    .lean();

  return {
    currentPage,
    totalPages,
    totalVariants,
    variants: variants.map((variant) => ({
      category: variant.category?.name || "Sin categoría",
      colorHex: variant.colorHex || "",
      colorName: variant.colorName || "Sin color",
      id: variant._id.toString(),
      discount: getDiscountSummary(variant),
      finalPrice: getFinalPrice(variant),
      price: variant.price,
      productName: variant.product?.name || variant.baseProductName,
      showInCatalog: variant.showInCatalog,
      size: variant.size || "Sin talla",
      sku: variant.sku,
      status: variant.status || "draft",
      stock: variant.stock || 0,
    })),
  };
}

function getDiscountSummary(variant) {
  if (!variant.discount?.isActive || variant.discount.type === "none" || !variant.discount.value) {
    return null;
  }

  return {
    label: variant.discount.type === "percent"
      ? `${variant.discount.value}% OFF`
      : `-${formatMoney(variant.discount.value)}`,
    type: variant.discount.type,
    value: variant.discount.value,
  };
}

function getFinalPrice(variant) {
  const price = variant.price || 0;

  if (!variant.discount?.isActive || variant.discount.type === "none" || !variant.discount.value) {
    return price;
  }

  if (variant.discount.type === "percent") {
    return Math.max(0, Number((price - (price * variant.discount.value) / 100).toFixed(2)));
  }

  return Math.max(0, Number((price - variant.discount.value).toFixed(2)));
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-EC", {
    currency: "USD",
    style: "currency",
  }).format(value || 0);
}

export default async function AdminCatalogVariantsPage({ searchParams }) {
  const params = normalizeSearchParams(await searchParams);
  const [categories, inventoryResult] = await Promise.all([
    getInventoryCategories(),
    getVariants(params),
  ]);
  const { currentPage, totalPages, totalVariants, variants } = inventoryResult;

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Inventario</span>
          <h1>Existencias por presentación</h1>
          <p className="text-muted">
            Consulta y ajusta el stock disponible para cada talla, color y presentación del catálogo.
          </p>
        </div>
      </div>

      <InventoryCatalogControls
        key={`${params.category}:${params.q}`}
        categories={categories}
        currentCategory={params.category}
        currentPage={currentPage}
        currentQuery={params.q}
        totalPages={totalPages}
      />

      <div className="admin-product-list-summary">
        <span>{totalVariants} variante(s) encontrada(s)</span>
        <span>Mostrando {variants.length} de {VARIANTS_PER_PAGE}</span>
      </div>

      {variants.length ? (
        <InventoryTable key={`${params.category}:${params.q}:${currentPage}`} variants={variants} />
      ) : (
        <div className="admin-page__empty">
          <strong>No encontramos inventario.</strong>
          <span>Ajusta la búsqueda o limpia los filtros para volver al listado completo.</span>
        </div>
      )}
    </div>
  );
}

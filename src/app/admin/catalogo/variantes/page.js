import InventoryTable from "@/components/admin/InventoryTable";
import { connectDB } from "@/lib/db";
import "@/models/Category";
import "@/models/Product";
import ProductVariant from "@/models/ProductVariant";

export const metadata = {
  title: "Inventario | Admin Kowac",
};

async function getVariants() {
  await connectDB();

  const variants = await ProductVariant.find({ isActive: true })
    .populate("product", "name slug")
    .populate("category", "name slug")
    .sort({ updatedAt: -1 })
    .lean();

  return variants.map((variant) => ({
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
  }));
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

export default async function AdminCatalogVariantsPage() {
  const variants = await getVariants();

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Inventario</span>
          <h1>Variantes reales</h1>
          <p className="text-muted">
            Aquí se listan los productos tangibles generados desde los productos base.
          </p>
        </div>
      </div>

      {variants.length ? (
        <InventoryTable variants={variants} />
      ) : (
        <div className="admin-page__empty">
          <strong>No hay variantes reales todavía.</strong>
          <span>Genera variantes desde la ficha de un producto para empezar el inventario.</span>
        </div>
      )}
    </div>
  );
}

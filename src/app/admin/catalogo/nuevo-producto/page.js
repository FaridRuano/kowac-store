import ProductForm from "@/components/admin/ProductForm";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { ArrowLeft } from "lucide-react";
import { isValidObjectId } from "mongoose";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Nuevo producto | Admin Kowac",
};

async function getProductCategories() {
  await connectDB();

  const categories = await Category.find({ isActive: true })
    .select("name slug type")
    .sort({ type: 1, name: 1 })
    .lean();

  return categories.map((category) => ({
    id: category._id.toString(),
    name: category.name,
    slug: category.slug,
    type: category.type,
  }));
}

function buildProductLookup(value) {
  return isValidObjectId(value) ? { _id: value } : { slug: value };
}

async function getEditableProduct(productId) {
  await connectDB();

  const product = await Product.findOne(buildProductLookup(productId))
    .select("name type apparelFit gender category baseCost basePrice price status showInCatalog shortDescription description")
    .lean();

  if (!product) {
    return null;
  }

  return {
    apparelFit: product.apparelFit || "",
    baseCost: product.baseCost || 0,
    basePrice: product.basePrice || product.price || 0,
    category: product.category?.toString() || "",
    description: product.description || "",
    gender: product.gender || "mujer",
    id: product._id.toString(),
    name: product.name || "",
    shortDescription: product.shortDescription || "",
    showInCatalog: Boolean(product.showInCatalog),
    status: product.status || "draft",
    type: product.type || "zapatos",
  };
}

export default async function AdminCatalogNewProductPage({ searchParams }) {
  const params = await searchParams;
  const editId = Array.isArray(params?.editar) ? params.editar[0] : params?.editar;
  const [categories, product] = await Promise.all([
    getProductCategories(),
    editId ? getEditableProduct(editId) : null,
  ]);

  if (editId && !product) {
    notFound();
  }

  const isEditing = Boolean(product);

  return (
    <div className="admin-page">
      {isEditing ? (
        <Link href={`/admin/catalogo/productos/${product.id}`} className="admin-page__action-pill admin-page__back-link">
          <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
          Volver
        </Link>
      ) : null}

      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Catálogo</span>
          <h1>{isEditing ? "Editar producto" : "Nuevo producto"}</h1>
          <p className="text-muted">
            {isEditing
              ? "Ajusta la información base del producto. Las variantes, tallas, colores e imágenes se administran desde su ficha."
              : "Crea la información base del producto. Luego podremos cargar variantes, tallas, colores e imágenes."}
          </p>
        </div>
      </div>

      <ProductForm key={product?.id || "new-product"} categories={categories} product={product} />
    </div>
  );
}

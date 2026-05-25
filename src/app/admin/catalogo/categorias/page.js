import Link from "next/link";

import CategoryTableNavigator from "@/components/admin/CategoryTableNavigator";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";

export const metadata = {
  title: "Categorías | Admin Kowac",
};

async function getCategories() {
  await connectDB();

  const categories = await Category.find({})
    .select("name slug type isActive createdAt")
    .sort({ type: 1, name: 1 })
    .lean();

  const categoryIds = categories.map((category) => category._id);
  const products = await Product.find({ category: { $in: categoryIds } }).select("category").lean();

  const productCountsByCategory = products.reduce((counts, product) => {
    const categoryId = product.category?.toString();

    if (categoryId) {
      counts[categoryId] = (counts[categoryId] || 0) + 1;
    }

    return counts;
  }, {});

  return categories.map((category) => ({
    id: category._id.toString(),
    name: category.name,
    productsCount: productCountsByCategory[category._id.toString()] || 0,
    slug: category.slug,
    status: category.isActive ? "Activa" : "Inactiva",
    type: category.type,
  }));
}

export default async function AdminCatalogCategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Catálogo</span>
          <h1>Categorías</h1>
          <p className="text-muted">
            Revisa las categorías que ordenan el catálogo. Haz doble click en una categoría para abrir sus productos.
          </p>
        </div>
        <Link href="/admin/configuracion/tienda" className="admin-page__action-pill">
          Administrar tienda
        </Link>
      </div>

      {categories.length ? (
        <CategoryTableNavigator categories={categories} />
      ) : (
        <div className="admin-page__empty">
          <strong>No hay categorías registradas.</strong>
          <span>Crea categorías desde configuración de tienda para empezar a organizar productos.</span>
        </div>
      )}
    </div>
  );
}

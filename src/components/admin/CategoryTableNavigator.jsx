"use client";

import { Expand } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";

export default function CategoryTableNavigator({ categories }) {
  const clickTrackerRef = useRef({ categoryId: null, timeoutId: null });
  const router = useRouter();

  function openCategory(category) {
    router.push(`/admin/catalogo/categorias/${category.slug}`);
  }

  function handleCategoryClick(category) {
    const tracker = clickTrackerRef.current;
    const isSecondClick = tracker.categoryId === category.id;

    if (tracker.timeoutId) {
      window.clearTimeout(tracker.timeoutId);
    }

    if (isSecondClick) {
      clickTrackerRef.current = { categoryId: null, timeoutId: null };
      openCategory(category);
      return;
    }

    clickTrackerRef.current = {
      categoryId: category.id,
      timeoutId: window.setTimeout(() => {
        clickTrackerRef.current = { categoryId: null, timeoutId: null };
      }, 320),
    };
  }

  return (
    <div className="admin-page__table-wrap">
      <table className="admin-page__table admin-category-table">
        <thead>
          <tr>
            <th>Categoría</th>
            <th>Tipo</th>
            <th>Slug</th>
            <th>Productos</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr
              key={category.id}
              className="admin-category-table__row"
              onClick={() => handleCategoryClick(category)}
            >
              <td className="admin-page__primary-cell">
                <strong>{category.name}</strong>
                <span>Doble click para abrir productos</span>
              </td>
              <td>{category.type}</td>
              <td>{category.slug}</td>
              <td>{category.productsCount}</td>
              <td>
                <span className={`admin-page__status ${category.status === "Activa" ? "admin-page__status--success" : "admin-page__status--muted"}`}>
                  {category.status}
                </span>
              </td>
              <td>
                <Link
                  href={`/admin/catalogo/categorias/${category.slug}`}
                  className="admin-table-icon-link"
                  aria-label={`Abrir productos de ${category.name}`}
                >
                  <Expand size={15} strokeWidth={1.9} aria-hidden="true" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

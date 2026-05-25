import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

import { createStoreCategory, deleteStoreCategory } from "@/app/admin/configuracion/tienda/actions";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";

export const metadata = {
  title: "Tienda | Admin Kowac",
};

const categoryGroups = {
  calzado: {
    label: "Calzado",
    type: "zapatos",
    publicPath: "/zapatos",
    description: "Categorías visibles para organizar la colección de zapatos.",
    defaultCategories: [
      { name: "Casuales", slug: "casuales", status: "Activa" },
      { name: "Chunkys", slug: "chunkys", status: "Activa" },
      { name: "Formales", slug: "formales", status: "Activa" },
      { name: "Botines", slug: "botines", status: "Activa" },
      { name: "Botas de cuero", slug: "botas-cuero", status: "Activa" },
      { name: "Botas microfibra", slug: "botas-microfibra", status: "Activa" },
    ],
  },
  ropa: {
    label: "Ropa",
    type: "ropa",
    publicPath: "/ropa",
    description: "Categorías visibles para organizar la colección de indumentaria.",
    defaultCategories: [
      { name: "Casual", slug: "casual", status: "Activa" },
      { name: "Ternos de vestir", slug: "ternos-de-vestir", status: "Activa" },
      { name: "Vestidos", slug: "vestidos", status: "Activa" },
      { name: "Abrigos", slug: "abrigos", status: "Activa" },
      { name: "Chaquetas", slug: "chaquetas", status: "Activa" },
    ],
  },
};

function getSelectedGroup(value) {
  const selectedValue = Array.isArray(value) ? value[0] : value;

  if (selectedValue === "ropa") {
    return "ropa";
  }

  return "calzado";
}

async function seedDefaultCategoriesOnce() {
  await connectDB();

  const existingCount = await Category.countDocuments({
    type: { $in: ["zapatos", "ropa"] },
  });

  if (existingCount > 0) {
    return;
  }

  const defaults = Object.values(categoryGroups).flatMap((group) =>
    group.defaultCategories.map((category) => ({
      ...category,
      type: group.type,
      isActive: true,
    }))
  );

  await Category.insertMany(defaults, { ordered: false });
}

async function getCategoriesByType(type) {
  await seedDefaultCategoriesOnce();

  const categories = await Category.find({ type, isActive: true })
    .select("name slug description type isActive createdAt")
    .sort({ createdAt: 1, name: 1 })
    .lean();

  return categories.map((category) => ({
    id: category._id.toString(),
    name: category.name,
    slug: category.slug,
    description: category.description,
    type: category.type,
    status: category.isActive ? "Activa" : "Inactiva",
  }));
}

export default async function AdminStoreSettingsPage({ searchParams }) {
  const params = await searchParams;
  const selectedGroupKey = getSelectedGroup(params?.tipo);
  const selectedGroup = categoryGroups[selectedGroupKey];
  const categories = await getCategoriesByType(selectedGroup.type);
  const editId = Array.isArray(params?.editar) ? params.editar[0] : params?.editar;
  const categoryToEdit = categories.find((category) => category.id === editId);

  return (
    <div className="admin-page admin-store-settings">
      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Configuración</span>
          <h1>Tienda</h1>
          <p className="text-muted">
            Administra las categorías de calzado y ropa que ordenan el catálogo público de Kowac.
          </p>
        </div>
        <span className="admin-page__count">
          {categories.length} categoría(s)
        </span>
      </div>

      <p className="admin-page__section-summary">
        Elige una sección para revisar, agregar o eliminar sus categorías visibles.
      </p>

      <div className="admin-store-settings__selector" aria-label="Tipo de categorías">
        {Object.entries(categoryGroups).map(([key, group]) => (
          <Link
            key={key}
            href={`/admin/configuracion/tienda?tipo=${key}`}
            className={`admin-store-settings__selector-option ${selectedGroupKey === key ? "admin-store-settings__selector-option--active" : ""}`}
            aria-current={selectedGroupKey === key ? "page" : undefined}
          >
            <strong>{group.label}</strong>
          </Link>
        ))}
      </div>

      <section className="admin-store-settings__panel" aria-labelledby="store-settings-active-group">
        <div className="admin-page__header admin-store-settings__panel-header">
          <div>
            <h2 id="store-settings-active-group">{selectedGroup.label}</h2>
            <p>{selectedGroup.description}</p>
          </div>
          <Link href={selectedGroup.publicPath} className="admin-page__action-pill">
            <ExternalLink size={15} strokeWidth={1.8} aria-hidden="true" />
            <span>Ver página pública</span>
          </Link>
        </div>

        <form action={createStoreCategory} className="admin-store-settings__form">
          {categoryToEdit ? <input type="hidden" name="id" value={categoryToEdit.id} /> : null}
          <input type="hidden" name="type" value={selectedGroup.type} />
          <label>
            Nombre
            <input
              name="name"
              type="text"
              placeholder="Ej. Botas"
              required
              minLength={2}
              defaultValue={categoryToEdit?.name || ""}
            />
          </label>
          <label>
            Slug
            <input
              name="slug"
              type="text"
              placeholder="Se genera si queda vacío"
              defaultValue={categoryToEdit?.slug || ""}
            />
          </label>
          <label>
            Descripción
            <input
              name="description"
              type="text"
              placeholder="Uso interno opcional"
              defaultValue={categoryToEdit?.description || ""}
            />
          </label>
          <button type="submit">
            {categoryToEdit ? (
              <Pencil size={16} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Plus size={16} strokeWidth={2} aria-hidden="true" />
            )}
            <span>{categoryToEdit ? "Guardar cambios" : "Agregar categoría"}</span>
          </button>
          {categoryToEdit ? (
            <Link href={`/admin/configuracion/tienda?tipo=${selectedGroupKey}`} className="admin-store-settings__cancel-edit">
              Cancelar
            </Link>
          ) : null}
        </form>

        {categories.length ? (
          <div className="admin-page__table-wrap">
            <table className="admin-page__table admin-store-settings__table">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Slug</th>
                  <th>Ruta pública</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <strong>{category.name}</strong>
                      {category.description ? <span>{category.description}</span> : null}
                    </td>
                    <td>{category.slug}</td>
                    <td>{`${selectedGroup.publicPath}?subtype=${category.slug}`}</td>
                    <td>
                      <span className="admin-page__status admin-page__status--success">
                        {category.status}
                      </span>
                    </td>
                    <td>
                      <div className="admin-store-settings__actions">
                        <Link
                          href={`/admin/configuracion/tienda?tipo=${selectedGroupKey}&editar=${category.id}`}
                          className="admin-store-settings__edit"
                          aria-label={`Editar ${category.name}`}
                        >
                          <Pencil size={15} strokeWidth={1.9} aria-hidden="true" />
                        </Link>
                        <form action={deleteStoreCategory}>
                          <input type="hidden" name="id" value={category.id} />
                          <input type="hidden" name="type" value={category.type} />
                          <button
                            type="submit"
                            className="admin-store-settings__delete"
                            aria-label={`Eliminar ${category.name}`}
                          >
                            <Trash2 size={15} strokeWidth={1.9} aria-hidden="true" />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-page__empty">
            <strong>No hay categorías activas.</strong>
            <span>Agrega una categoría para mostrarla en esta sección.</span>
          </div>
        )}
      </section>
    </div>
  );
}

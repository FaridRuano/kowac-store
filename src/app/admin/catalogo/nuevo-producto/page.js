import ProductForm from "@/components/admin/ProductForm";

export const metadata = {
  title: "Nuevo producto | Admin Kowac",
};

export default function AdminCatalogNewProductPage() {
  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Catálogo</span>
          <h1>Nuevo producto</h1>
          <p className="text-muted">
            Este espacio queda separado para construir el formulario completo con variantes, tallas, colores e imágenes.
          </p>
        </div>
      </div>

      <ProductForm />
    </div>
  );
}

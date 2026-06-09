import { ImageIcon, Pencil, Upload } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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

export default function ProductRealVariantsTable({ variants = [] }) {
  return (
    <section className="admin-product-real-variants" aria-label="Presentaciones del producto">
      <div className="admin-product-real-variants__header">
        <div>
          <span className="eyebrow">Presentaciones</span>
          <h2>Disponibilidad por opción</h2>
        </div>
        <span>{variants.length} variante(s)</span>
      </div>

      {variants.length ? (
        <div className="admin-product-real-variants__table-wrap">
          <table className="admin-product-real-variants__table">
            <thead>
              <tr>
                <th>Variante</th>
                <th>Talla</th>
                <th>Color</th>
                <th>Stock</th>
                <th>Precio</th>
                <th>Estado</th>
                <th>Catálogo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => (
                <tr key={variant.id}>
                  <td>
                    <div className="admin-product-real-variants__identity">
                      {variant.primaryImage ? (
                        <Image
                          src={variant.primaryImage}
                          alt={variant.imageAlt}
                          width={52}
                          height={52}
                          className="admin-product-real-variants__image"
                        />
                      ) : (
                        <span className="admin-product-real-variants__image-empty">
                          <ImageIcon size={18} strokeWidth={1.8} aria-hidden="true" />
                        </span>
                      )}
                      <span>
                        <strong>{variant.name}</strong>
                        <small>{variant.sku}</small>
                      </span>
                    </div>
                  </td>
                  <td>{variant.size || "Sin talla"}</td>
                  <td>
                    <span className="admin-product-options__table-color">
                      {variant.colorHex ? (
                        <span className="admin-product-options__swatch" style={{ backgroundColor: variant.colorHex }} />
                      ) : null}
                      {variant.colorName || "Sin color"}
                    </span>
                  </td>
                  <td>
                    <span className={variant.stock > 0 ? "admin-stock-pill admin-stock-pill--ok" : "admin-stock-pill"}>
                      {variant.stock}
                    </span>
                  </td>
                  <td>{formatMoney(variant.price)}</td>
                  <td>
                    <span className={`admin-page__status ${variant.status === "active" ? "admin-page__status--success" : "admin-page__status--muted"}`}>
                      {formatVariantStatus(variant.status)}
                    </span>
                  </td>
                  <td>{variant.showInCatalog ? "Visible" : "Oculto"}</td>
                  <td>
                    <div className="admin-product-real-variants__actions">
                      <Link href={`/admin/catalogo/variantes/${variant.id}`} aria-label={`Editar ${variant.name}`} title="Editar variante">
                        <Pencil size={15} strokeWidth={1.9} aria-hidden="true" />
                      </Link>
                      <Link href={`/admin/catalogo/variantes/${variant.id}#imagenes`} aria-label={`Gestionar imágenes de ${variant.name}`} title="Gestionar imágenes">
                        <Upload size={15} strokeWidth={1.9} aria-hidden="true" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-product-real-variants__empty">
          <strong>No hay variantes reales todavía.</strong>
          <span>Guarda las opciones y usa “Generar variantes” para crear el inventario real.</span>
        </div>
      )}
    </section>
  );
}

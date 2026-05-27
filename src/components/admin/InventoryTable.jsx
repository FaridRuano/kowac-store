"use client";

import { useRouter } from "next/navigation";

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

export default function InventoryTable({ variants = [] }) {
  const router = useRouter();

  return (
    <div className="admin-page__table-wrap">
      <table className="admin-page__table">
        <thead>
          <tr>
            <th>Producto base</th>
            <th>Talla</th>
            <th>Color</th>
            <th>Stock</th>
            <th>Precio</th>
            <th>Catálogo</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {variants.map((variant) => (
            <tr
              key={variant.id}
              className="admin-inventory-row"
              tabIndex={0}
              onClick={() => router.push(`/admin/catalogo/variantes/${variant.id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  router.push(`/admin/catalogo/variantes/${variant.id}`);
                }
              }}
            >
              <td className="admin-page__primary-cell">
                <strong>{variant.productName}</strong>
              </td>
              <td>{variant.size}</td>
              <td>
                <span className="admin-product-options__table-color">
                  {variant.colorHex ? (
                    <span className="admin-product-options__swatch" style={{ backgroundColor: variant.colorHex }} />
                  ) : null}
                  {variant.colorName}
                </span>
              </td>
              <td>{variant.stock}</td>
              <td>
                <span className="admin-inventory-price">
                  {variant.discount ? (
                    <>
                      <strong>{formatMoney(variant.finalPrice)}</strong>
                      <span className="admin-inventory-price__meta">
                        <span className="admin-inventory-price__base">{formatMoney(variant.price)}</span>
                        <small>{variant.discount.label}</small>
                      </span>
                    </>
                  ) : (
                    <strong>{formatMoney(variant.price)}</strong>
                  )}
                </span>
              </td>
              <td>{variant.showInCatalog ? "Visible" : "Oculto"}</td>
              <td>
                <span className={`admin-page__status ${variant.status === "active" ? "admin-page__status--success" : "admin-page__status--muted"}`}>
                  {formatVariantStatus(variant.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

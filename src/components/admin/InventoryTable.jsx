"use client";

import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";

import AdminToast from "@/components/admin/AdminToast";

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
  const [inventoryRows, setInventoryRows] = useState(variants);
  const [stockModal, setStockModal] = useState(null);
  const [stockForm, setStockForm] = useState({ note: "", quantity: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  function openStockModal(event, variant, type) {
    event.stopPropagation();
    setStockForm({ note: "", quantity: "" });
    setStockModal({ type, variant });
  }

  async function handleStockSubmit(event) {
    event.preventDefault();

    if (!stockModal) {
      return;
    }

    setIsSubmitting(true);
    setToast(null);

    try {
      const response = await fetch(`/api/variants/${stockModal.variant.id}/stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          note: stockForm.note,
          quantity: stockForm.quantity,
          type: stockModal.type,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "No se pudo ajustar el stock.");
      }

      setInventoryRows((currentRows) =>
        currentRows.map((row) => (
          row.id === stockModal.variant.id ? { ...row, stock: result.stock || 0 } : row
        ))
      );
      setToast({
        message: stockModal.type === "in" ? "El stock se agregó correctamente." : "El stock se retiró correctamente.",
        title: "Stock actualizado",
        type: "success",
      });
      setStockModal(null);
      router.refresh();
    } catch (error) {
      setToast({
        message: error.message || "Revisa la cantidad e intenta nuevamente.",
        title: "No se pudo ajustar",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
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
              <th>Ajuste</th>
            </tr>
          </thead>
          <tbody>
            {inventoryRows.map((variant) => (
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
                <td>
                  <div className="admin-inventory-actions" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(event) => openStockModal(event, variant, "in")}
                      aria-label={`Agregar stock a ${variant.productName}`}
                      title="Agregar stock"
                    >
                      <Plus size={15} strokeWidth={1.9} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={(event) => openStockModal(event, variant, "out")}
                      aria-label={`Retirar stock de ${variant.productName}`}
                      title="Retirar stock"
                    >
                      <Minus size={15} strokeWidth={1.9} aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {typeof document !== "undefined" && stockModal
        ? createPortal(
            <div className="admin-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="stock-adjustment-title">
              <form className="admin-stock-modal" onSubmit={handleStockSubmit}>
                <div>
                  <span className="eyebrow">
                    {stockModal.type === "in" ? "Agregar stock" : "Retirar stock"}
                  </span>
                  <h3 id="stock-adjustment-title">{stockModal.variant.productName}</h3>
                  <p>
                    {stockModal.variant.size} / {stockModal.variant.colorName} · Stock actual: {stockModal.variant.stock}
                  </p>
                </div>

                <label>
                  <span>Cantidad</span>
                  <input
                    value={stockForm.quantity}
                    onChange={(event) => setStockForm((current) => ({
                      ...current,
                      quantity: event.target.value.replace(/\D/g, ""),
                    }))}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                    required
                  />
                </label>

                <label>
                  <span>Nota</span>
                  <textarea
                    value={stockForm.note}
                    onChange={(event) => setStockForm((current) => ({
                      ...current,
                      note: event.target.value,
                    }))}
                    placeholder="Ej. Ajuste manual por recepción de mercadería"
                    rows={4}
                  />
                </label>

                <div className="admin-confirm-dialog__actions">
                  <button type="button" onClick={() => setStockModal(null)}>
                    Cancelar
                  </button>
                  <button type="submit" className={stockModal.type === "out" ? "admin-confirm-dialog__danger" : ""} disabled={isSubmitting}>
                    {isSubmitting ? "Guardando..." : stockModal.type === "in" ? "Agregar" : "Retirar"}
                  </button>
                </div>
              </form>
            </div>,
            document.body
          )
        : null}

      <AdminToast
        message={toast?.message}
        title={toast?.title}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </>
  );
}

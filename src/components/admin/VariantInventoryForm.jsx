"use client";

import { useState } from "react";

import AdminToast from "@/components/admin/AdminToast";

export default function VariantInventoryForm({ variant }) {
  const [formData, setFormData] = useState(() => getInitialFormState(variant));
  const [savedData, setSavedData] = useState(() => getInitialFormState(variant));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(savedData);

  function handleChange(event) {
    const { checked, name, type, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleDiscountChange(event) {
    const { checked, name, type, value } = event.target;

    setFormData((current) => ({
      ...current,
      discount: {
        ...current.discount,
        [name]: type === "checkbox" ? checked : value,
      },
    }));
  }

  function handleIntegerChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value.replace(/\D/g, ""),
    }));
  }

  function handleMoneyChange(event) {
    const { name, value } = event.target;
    const normalizedValue = value
      .replace(/[^\d.]/g, "")
      .replace(/(\..*)\./g, "$1")
      .replace(/^(\d+)(\.\d{0,2})?.*$/, "$1$2");

    setFormData((current) => ({
      ...current,
      [name]: normalizedValue,
    }));
  }

  function handleDiscountMoneyChange(event) {
    const { name, value } = event.target;
    const normalizedValue = value
      .replace(/[^\d.]/g, "")
      .replace(/(\..*)\./g, "$1")
      .replace(/^(\d+)(\.\d{0,2})?.*$/, "$1$2");

    setFormData((current) => ({
      ...current,
      discount: {
        ...current.discount,
        [name]: normalizedValue,
      },
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setToast(null);

    try {
      const response = await fetch(`/api/variants/${variant.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildPayload(formData)),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "No se pudo actualizar la variante.");
      }

      setSavedData(formData);
      setToast({
        message: "Los cambios de inventario se guardaron correctamente.",
        title: "Variante actualizada",
        type: "success",
      });
    } catch (error) {
      setToast({
        message: error.message || "Revisa la información e intenta nuevamente.",
        title: "No se pudo guardar",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="admin-product-form" onSubmit={handleSubmit}>
      <div className="admin-product-form__header">
        <strong>Inventario y venta</strong>
      </div>

      <div className="admin-product-form__grid">
        <label>
          <span>Stock disponible</span>
          <input
            name="stock"
            value={formData.stock}
            onChange={handleIntegerChange}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="0"
          />
        </label>

        <label>
          <span>Stock reservado</span>
          <input
            name="reservedStock"
            value={formData.reservedStock}
            onChange={handleIntegerChange}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="0"
          />
        </label>

        <label>
          <span>Costo</span>
          <input name="cost" value={formData.cost} onChange={handleMoneyChange} placeholder="0.00" />
        </label>

        <label>
          <span>Precio</span>
          <input name="price" value={formData.price} onChange={handleMoneyChange} placeholder="0.00" />
        </label>

        <label>
          <span>Precio comparativo</span>
          <input name="compareAtPrice" value={formData.compareAtPrice} onChange={handleMoneyChange} placeholder="Opcional" />
        </label>

        <label>
          <span>Estado</span>
          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="draft">Borrador</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </label>

        <label className={`admin-product-form__visibility ${formData.showInCatalog ? "admin-product-form__visibility--active" : ""}`}>
          <span>Catálogo</span>
          <input name="showInCatalog" type="checkbox" checked={formData.showInCatalog} onChange={handleChange} />
          <span className="admin-product-form__visibility-control">
            <span>{formData.showInCatalog ? "Visible en catálogo" : "Oculto en catálogo"}</span>
          </span>
        </label>

        <label className={`admin-product-form__visibility ${formData.isFeatured ? "admin-product-form__visibility--active" : ""}`}>
          <span>Destacado</span>
          <input name="isFeatured" type="checkbox" checked={formData.isFeatured} onChange={handleChange} />
          <span className="admin-product-form__visibility-control">
            <span>{formData.isFeatured ? "Producto destacado" : "No destacado"}</span>
          </span>
        </label>
      </div>

      <div className="admin-product-form__section">
        <div className="admin-product-form__header">
          <strong>Descuento</strong>
        </div>

        <div className="admin-product-form__grid">
          <label>
            <span>Tipo</span>
            <select name="type" value={formData.discount.type} onChange={handleDiscountChange}>
              <option value="none">Sin descuento</option>
              <option value="percent">Porcentaje</option>
              <option value="fixed">Valor fijo</option>
            </select>
          </label>

          <label>
            <span>Valor</span>
            <input name="value" value={formData.discount.value} onChange={handleDiscountMoneyChange} placeholder="0.00" />
          </label>

          <label className={`admin-product-form__visibility ${formData.discount.isActive ? "admin-product-form__visibility--active" : ""}`}>
            <span>Promoción</span>
            <input name="isActive" type="checkbox" checked={formData.discount.isActive} onChange={handleDiscountChange} />
            <span className="admin-product-form__visibility-control">
              <span>{formData.discount.isActive ? "Descuento activo" : "Descuento inactivo"}</span>
            </span>
          </label>
        </div>
      </div>

      <div className="admin-product-form__footer">
        <button type="submit" disabled={isSubmitting || !hasChanges}>
          {isSubmitting ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      <AdminToast
        message={toast?.message}
        title={toast?.title}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </form>
  );
}

function getInitialFormState(variant) {
  return {
    compareAtPrice: formatMoneyInput(variant.compareAtPrice),
    cost: formatMoneyInput(variant.cost),
    discount: {
      isActive: Boolean(variant.discount?.isActive),
      type: variant.discount?.type || "none",
      value: formatMoneyInput(variant.discount?.value),
    },
    isFeatured: Boolean(variant.isFeatured),
    price: formatMoneyInput(variant.price),
    reservedStock: String(variant.reservedStock || 0),
    showInCatalog: Boolean(variant.showInCatalog),
    status: variant.status || "draft",
    stock: String(variant.stock || 0),
  };
}

function buildPayload(formData) {
  return {
    compareAtPrice: formData.compareAtPrice === "" ? null : Number(formData.compareAtPrice),
    cost: Number(formData.cost || 0),
    discount: {
      isActive: formData.discount.isActive,
      type: formData.discount.type,
      value: Number(formData.discount.value || 0),
    },
    isFeatured: formData.isFeatured,
    price: Number(formData.price || 0),
    reservedStock: Number.parseInt(formData.reservedStock, 10) || 0,
    showInCatalog: formData.showInCatalog,
    status: formData.status,
    stock: Number.parseInt(formData.stock, 10) || 0,
  };
}

function formatMoneyInput(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  return Number(value).toFixed(2);
}

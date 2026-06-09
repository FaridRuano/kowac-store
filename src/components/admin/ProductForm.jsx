"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import AdminToast from "@/components/admin/AdminToast";

const initialState = {
  apparelFit: "",
  baseCost: "",
  basePrice: "",
  category: "",
  description: "",
  gender: "mujer",
  name: "",
  showInCatalog: false,
  shortDescription: "",
  status: "draft",
  type: "zapatos",
};

export default function ProductForm({ categories = [], product = null }) {
  const isEditing = Boolean(product?.id);
  const [formData, setFormData] = useState(() => getInitialFormState(product));
  const [savedFormData, setSavedFormData] = useState(() => getInitialFormState(product));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const availableCategories = categories.filter((category) => category.type === formData.type);
  const hasChanges = !areFormStatesEqual(formData, savedFormData);
  const isSubmitDisabled = isSubmitting || (isEditing && !hasChanges);

  function handleChange(event) {
    const { checked, name, type, value } = event.target;
    const nextTypeData = name === "type"
      ? {
          apparelFit: value === "ropa" ? "normal" : "",
          category: "",
        }
      : {};

    setFormData((current) => ({
      ...current,
      ...nextTypeData,
      [name]: type === "checkbox" ? checked : value,
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

  function handleMoneyBlur(event) {
    const { name, value } = event.target;

    if (!value) {
      return;
    }

    setFormData((current) => ({
      ...current,
      [name]: Number(value).toFixed(2),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setToast(null);

    try {
      const endpoint = isEditing ? `/api/products/${product.id}` : "/api/products";
      const response = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildProductPayload(formData)),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "No se pudo guardar el producto.");
      }

      setToast({
        message: isEditing
          ? "Los cambios del producto se guardaron correctamente."
          : "El producto se guardó correctamente.",
        title: isEditing ? "Producto actualizado" : "Producto guardado",
        type: "success",
      });
      if (!isEditing) {
        setFormData(initialState);
      } else {
        setSavedFormData(formData);
      }
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
    <form onSubmit={handleSubmit} className="admin-product-form">
      <div className="admin-product-form__header">
        <strong>Información base</strong>
      </div>

      <div className="admin-product-form__grid">
        <label>
          <span>Nombre</span>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Kowac Heritage Boot"
          />
        </label>

        <label>
          <span>Costo base</span>
          <input
            name="baseCost"
            value={formData.baseCost}
            onBlur={handleMoneyBlur}
            onChange={handleMoneyChange}
            type="number"
            min="0"
            step="0.01"
            placeholder="48.00"
          />
        </label>

        <label>
          <span>Precio de venta</span>
          <input
            name="basePrice"
            value={formData.basePrice}
            onBlur={handleMoneyBlur}
            onChange={handleMoneyChange}
            type="number"
            min="0"
            step="0.01"
            placeholder="129.90"
          />
        </label>

        <label>
          <span>Género</span>
          <select name="gender" value={formData.gender} onChange={handleChange}>
            <option value="hombre">Hombre</option>
            <option value="mujer">Mujer</option>
            <option value="unisex">Unisex</option>
            <option value="niños">Niños</option>
          </select>
        </label>

        <label>
          <span>Tipo</span>
          <select name="type" value={formData.type} onChange={handleChange}>
            <option value="zapatos">Calzado</option>
            <option value="ropa">Ropa</option>
          </select>
        </label>

        <label>
          <span>Categoría</span>
          <select name="category" value={formData.category} onChange={handleChange}>
            <option value="">Selecciona categoría</option>
            {availableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        {formData.type === "ropa" ? (
          <label>
            <span>Corte</span>
            <select name="apparelFit" value={formData.apparelFit} onChange={handleChange}>
              <option value="normal">Normal</option>
              <option value="oversize">Oversize</option>
              <option value="fit">Fit</option>
            </select>
          </label>
        ) : null}

        <label>
          <span>Estado</span>
          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="draft">Borrador</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </label>

        <label className={`admin-product-form__visibility ${formData.showInCatalog ? "admin-product-form__visibility--active" : ""}`}>
          <span>Visibilidad</span>
          <input
            name="showInCatalog"
            type="checkbox"
            checked={formData.showInCatalog}
            onChange={handleChange}
          />
          <span className="admin-product-form__visibility-control">
            {formData.showInCatalog ? (
              <Eye size={16} strokeWidth={1.9} aria-hidden="true" />
            ) : (
              <EyeOff size={16} strokeWidth={1.9} aria-hidden="true" />
            )}
            <span>{formData.showInCatalog ? "Visible en catálogo" : "Oculto en catálogo"}</span>
          </span>
        </label>
      </div>

      <div className="admin-product-form__section">
        <div className="admin-product-form__header">
          <strong>Contenido</strong>
        </div>

        <label>
          <span>Descripción corta</span>
          <input
            name="shortDescription"
            value={formData.shortDescription}
            onChange={handleChange}
            placeholder="Botín de cuero para uso diario"
          />
        </label>

        <label>
          <span>Descripción completa</span>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="<h3>Materiales</h3><ul><li>Exterior en cuero.</li></ul>"
            rows={9}
          />
        </label>
      </div>

      <div className="admin-product-form__footer">
        {isEditing ? (
          <Link href="/admin/catalogo/productos" className="admin-product-form__cancel">
            Cancelar
          </Link>
        ) : null}
        <button type="submit" disabled={isSubmitDisabled}>
          {isSubmitting ? "Guardando..." : isEditing ? "Guardar cambios" : "Guardar producto"}
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

function buildProductPayload(formData) {
  const basePrice = parseMoneyValue(formData.basePrice);

  return {
    baseCost: parseMoneyValue(formData.baseCost),
    basePrice,
    apparelFit: formData.type === "ropa" ? formData.apparelFit || "normal" : "",
    category: formData.category,
    description: formData.description,
    gender: formData.gender,
    name: formData.name,
    price: basePrice,
    shortDescription: formData.shortDescription,
    showInCatalog: formData.showInCatalog,
    status: formData.status,
    type: formData.type,
  };
}

function parseMoneyValue(value) {
  if (!value) {
    return 0;
  }

  return Number(Number(value).toFixed(2));
}

function getInitialFormState(product) {
  if (!product) {
    return initialState;
  }

  return {
    apparelFit: product.apparelFit || (product.type === "ropa" ? "normal" : ""),
    baseCost: formatMoneyForInput(product.baseCost),
    basePrice: formatMoneyForInput(product.basePrice),
    category: product.category || "",
    description: product.description || "",
    gender: product.gender || "mujer",
    name: product.name || "",
    showInCatalog: Boolean(product.showInCatalog),
    shortDescription: product.shortDescription || "",
    status: product.status || "draft",
    type: product.type || "zapatos",
  };
}

function formatMoneyForInput(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  return Number(value).toFixed(2);
}

function areFormStatesEqual(currentState, savedState) {
  return JSON.stringify(currentState) === JSON.stringify(savedState);
}

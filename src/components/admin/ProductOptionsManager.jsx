"use client";

import { Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

import AdminToast from "@/components/admin/AdminToast";

const emptySizeForm = { value: "" };
const emptyColorForm = { hex: "#b77a38", name: "" };

export default function ProductOptionsManager({ productId, productName = "Producto", options = [] }) {
  const router = useRouter();
  const [sizes, setSizes] = useState(() => getOptionValues(options, "size"));
  const [colors, setColors] = useState(() => getOptionValues(options, "color"));
  const [savedOptions, setSavedOptions] = useState(() => buildProductOptions(
    getOptionValues(options, "size"),
    getOptionValues(options, "color")
  ));
  const [sizeForm, setSizeForm] = useState(emptySizeForm);
  const [colorForm, setColorForm] = useState(emptyColorForm);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const normalizedOptions = useMemo(() => buildProductOptions(sizes, colors), [sizes, colors]);
  const possibleVariants = useMemo(
    () => buildPossibleVariants(productName, sizes, colors),
    [colors, productName, sizes]
  );
  const hasChanges = JSON.stringify(normalizedOptions) !== JSON.stringify(savedOptions);

  function handleAddSize(event) {
    event.preventDefault();
    const nextSize = sizeForm.value.trim();

    if (!/^[1-9]\d*$/.test(nextSize)) {
      setToast({
        message: "Ingresa una talla válida en números enteros.",
        title: "Talla inválida",
        type: "error",
      });
      return;
    }

    const exists = sizes.some((size) => size.value === nextSize);

    if (exists) {
      setToast({
        message: `La talla ${nextSize} ya existe en este producto.`,
        title: "Talla duplicada",
        type: "error",
      });
      return;
    }

    setSizes((current) => [...current, { label: nextSize, value: nextSize }].sort(sortByNumericValue));
    setSizeForm(emptySizeForm);
  }

  function handleAddColor(event) {
    event.preventDefault();
    const colorName = colorForm.name.trim();
    const colorHex = normalizeHex(colorForm.hex);

    if (!colorName || !colorHex) {
      setToast({
        message: "Ingresa un nombre y un tono hexadecimal válido para el color.",
        title: "Color inválido",
        type: "error",
      });
      return;
    }

    const colorValue = slugifyOptionValue(colorName);
    const exists = colors.some((color) => color.value === colorValue || color.hex.toLowerCase() === colorHex.toLowerCase());

    if (exists) {
      setToast({
        message: "Ese color ya existe por nombre o por tono hexadecimal.",
        title: "Color duplicado",
        type: "error",
      });
      return;
    }

    setColors((current) => [
      ...current,
      {
        hex: colorHex,
        label: colorName,
        value: colorValue,
      },
    ]);
    setColorForm(emptyColorForm);
  }

  async function handleSaveOptions() {
    setIsSaving(true);
    setToast(null);

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ options: normalizedOptions }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "No se pudieron guardar las opciones.");
      }

      setToast({
        message: "Las tallas y colores quedaron guardados correctamente.",
        title: "Opciones guardadas",
        type: "success",
      });
      setSavedOptions(normalizedOptions);
      router.refresh();
    } catch (error) {
      setToast({
        message: error.message || "Revisa la información e intenta nuevamente.",
        title: "No se pudo guardar",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleGenerateVariants() {
    setIsGenerating(true);
    setToast(null);

    try {
      const response = await fetch(`/api/products/${productId}/variants/generate`, {
        method: "POST",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "No se pudieron generar las variantes.");
      }

      setToast({
        message: `Se crearon ${result.created} variante(s). ${result.skipped} ya existían.`,
        title: "Variantes generadas",
        type: "success",
      });
      router.refresh();
    } catch (error) {
      setToast({
        message: error.message || "Revisa la información e intenta nuevamente.",
        title: "No se pudo generar",
        type: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  function handleRequestDelete(candidate) {
    setDeleteCandidate(candidate);
  }

  function handleConfirmDelete() {
    if (!deleteCandidate) {
      return;
    }

    if (deleteCandidate.type === "size") {
      setSizes((current) => current.filter((item) => item.value !== deleteCandidate.value));
    }

    if (deleteCandidate.type === "color") {
      setColors((current) => current.filter((item) => item.value !== deleteCandidate.value));
    }

    setDeleteCandidate(null);
  }

  return (
    <section className="admin-product-options" aria-label="Opciones de variantes">
      <div className="admin-product-options__header">
        <div>
          <span className="eyebrow">Variantes</span>
          <h2>Tallas y colores disponibles</h2>
        </div>
        <div className="admin-product-options__actions">
          <button type="button" onClick={handleSaveOptions} disabled={isSaving || !hasChanges}>
            <Save size={16} strokeWidth={1.9} aria-hidden="true" />
            {isSaving ? "Guardando..." : "Guardar opciones"}
          </button>
        </div>
      </div>

      <div className="admin-product-options__grid">
        <div className="admin-product-options__panel" id="tallas">
          <div className="admin-product-options__panel-header">
            <strong>Tallas</strong>
            <span>{sizes.length} registrada(s)</span>
          </div>

          <form className="admin-product-options__form" onSubmit={handleAddSize}>
            <label>
              <span>Valor entero</span>
              <input
                min="1"
                name="size"
                onChange={(event) => setSizeForm({ value: event.target.value.replace(/\D/g, "") })}
                onKeyDown={blockDecimalKeys}
                pattern="[0-9]*"
                placeholder="39"
                step="1"
                type="text"
                inputMode="numeric"
                value={sizeForm.value}
              />
            </label>
            <button type="submit" aria-label="Agregar talla" title="Agregar talla">
              <Plus size={16} strokeWidth={1.9} aria-hidden="true" />
            </button>
          </form>

          {sizes.length ? (
            <div className="admin-product-options__chips">
              {sizes.map((size) => (
                <span key={size.value} className="admin-product-options__chip">
                  {size.label}
                  <button
                    type="button"
                    onClick={() => handleRequestDelete({
                      label: size.label,
                      type: "size",
                      value: size.value,
                    })}
                    aria-label={`Eliminar talla ${size.label}`}
                  >
                    <Trash2 size={14} strokeWidth={1.9} aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="admin-product-options__empty">Todavía no hay tallas cargadas.</p>
          )}
        </div>

        <div className="admin-product-options__panel" id="colores">
          <div className="admin-product-options__panel-header">
            <strong>Colores</strong>
            <span>{colors.length} registrado(s)</span>
          </div>

          <form className="admin-product-options__form admin-product-options__form--color" onSubmit={handleAddColor}>
            <label>
              <span>Nombre</span>
              <input
                name="colorName"
                onChange={(event) => setColorForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Miel"
                value={colorForm.name}
              />
            </label>
            <label>
              <span>Tono hexadecimal</span>
              <div className="admin-product-options__color-input">
                <input
                  aria-label="Selector de tono"
                  onChange={(event) => setColorForm((current) => ({ ...current, hex: event.target.value }))}
                  type="color"
                  value={colorForm.hex}
                />
                <input
                  name="colorHex"
                  onChange={(event) => setColorForm((current) => ({ ...current, hex: event.target.value }))}
                  placeholder="#b77a38"
                  value={colorForm.hex}
                />
              </div>
            </label>
            <button type="submit" aria-label="Agregar color" title="Agregar color">
              <Plus size={16} strokeWidth={1.9} aria-hidden="true" />
            </button>
          </form>

          {colors.length ? (
            <div className="admin-product-options__color-list">
              {colors.map((color) => (
                <span key={color.value} className="admin-product-options__color-item">
                  <span className="admin-product-options__swatch" style={{ backgroundColor: color.hex }} />
                  <span>
                    <strong>{color.label}</strong>
                    <small>{color.hex}</small>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRequestDelete({
                      label: color.label,
                      type: "color",
                      value: color.value,
                    })}
                    aria-label={`Eliminar color ${color.label}`}
                  >
                    <Trash2 size={14} strokeWidth={1.9} aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="admin-product-options__empty">Todavía no hay colores cargados.</p>
          )}
        </div>
      </div>

      <div className="admin-product-options__variants">
        <div className="admin-product-options__panel-header">
          <strong>Variantes posibles</strong>
          <div className="admin-product-options__variants-actions">
            <span>{possibleVariants.length} combinación(es)</span>
            <button
              type="button"
              onClick={handleGenerateVariants}
              disabled={isGenerating || hasChanges || !possibleVariants.length}
              title={hasChanges ? "Guarda las opciones antes de generar variantes" : "Generar variantes reales"}
            >
              <Sparkles size={16} strokeWidth={1.9} aria-hidden="true" />
              {isGenerating ? "Generando..." : "Generar variantes"}
            </button>
          </div>
        </div>

        {possibleVariants.length ? (
          <div className="admin-product-options__table-wrap">
            <table className="admin-product-options__table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Talla</th>
                  <th>Color</th>
                </tr>
              </thead>
              <tbody>
                {possibleVariants.map((variant) => (
                  <tr key={variant.key}>
                    <td>{variant.name}</td>
                    <td>{variant.size || "Sin talla"}</td>
                    <td>
                      {variant.color ? (
                        <span className="admin-product-options__table-color">
                          <span className="admin-product-options__swatch" style={{ backgroundColor: variant.colorHex }} />
                          {variant.color}
                        </span>
                      ) : (
                        "Sin color"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-product-options__empty">
            Agrega al menos una talla o un color para previsualizar variantes.
          </p>
        )}
      </div>

      <AdminToast
        message={toast?.message}
        title={toast?.title}
        type={toast?.type}
        onClose={() => setToast(null)}
      />

      {typeof document !== "undefined" && deleteCandidate
        ? createPortal(
            <div className="admin-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-option-title">
              <div className="admin-confirm-dialog__panel">
                <div>
                  <span className="eyebrow">Confirmar eliminación</span>
                  <h3 id="delete-option-title">
                    Eliminar {deleteCandidate.type === "size" ? "talla" : "color"} {deleteCandidate.label}
                  </h3>
                  <p>
                    Esta acción quitará esa opción y actualizará las variantes posibles del producto.
                  </p>
                </div>
                <div className="admin-confirm-dialog__actions">
                  <button type="button" onClick={() => setDeleteCandidate(null)}>
                    Cancelar
                  </button>
                  <button type="button" className="admin-confirm-dialog__danger" onClick={handleConfirmDelete}>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </section>
  );
}

function getOptionValues(options, key) {
  return (options.find((option) => option.key === key)?.values || []).map((value) => ({
    hex: value.hex || "",
    label: value.label,
    value: value.value,
  }));
}

function buildProductOptions(sizes, colors) {
  return [
    {
      key: "size",
      label: "Talla",
      values: sizes.map((size) => ({
        label: size.label,
        value: size.value,
      })),
    },
    {
      key: "color",
      label: "Color",
      values: colors.map((color) => ({
        hex: color.hex,
        label: color.label,
        value: color.value,
      })),
    },
  ];
}

function buildPossibleVariants(productName, sizes, colors) {
  if (!sizes.length && !colors.length) {
    return [];
  }

  const variantSizes = sizes.length ? sizes : [{ label: "", value: "sin-talla" }];
  const variantColors = colors.length ? colors : [{ hex: "", label: "", value: "sin-color" }];

  return variantSizes.flatMap((size) =>
    variantColors.map((color) => {
      const sizeLabel = size.label;
      const colorLabel = color.label;
      const nameParts = [productName, sizeLabel, colorLabel]
        .filter(Boolean);

      return {
        color: colorLabel,
        colorHex: color.hex,
        key: `${size.value}-${color.value}`,
        name: nameParts.join(" "),
        size: sizeLabel,
      };
    })
  );
}

function normalizeHex(value) {
  const trimmedValue = value.trim();
  const hexValue = trimmedValue.startsWith("#") ? trimmedValue : `#${trimmedValue}`;

  return /^#[0-9a-fA-F]{6}$/.test(hexValue) ? hexValue.toLowerCase() : "";
}

function slugifyOptionValue(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sortByNumericValue(firstSize, secondSize) {
  return Number(firstSize.value) - Number(secondSize.value);
}

function blockDecimalKeys(event) {
  if ([".", ",", "e", "E", "+", "-"].includes(event.key)) {
    event.preventDefault();
  }
}

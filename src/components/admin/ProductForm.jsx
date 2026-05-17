"use client";

import { useState } from "react";

const initialState = {
  name: "",
  price: "",
  gender: "unisex",
  type: "zapatos",
};

export default function ProductForm() {
  const [formData, setFormData] = useState(initialState);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    console.info("Formulario base de producto listo para integrar con API.", formData);
  }

  return (
    <form onSubmit={handleSubmit} className="card-surface" style={{ padding: "1.5rem" }}>
      <div className="stack-md">
        <div>
          <strong>Nuevo producto</strong>
          <p className="text-muted" style={{ margin: "0.5rem 0 0" }}>
            Formulario scaffold para conectar luego con `/api/products`.
          </p>
        </div>

        <label className="stack-sm">
          <span>Nombre</span>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Kowac Heritage Boot"
            style={{ padding: "0.9rem 1rem", borderRadius: "1rem", border: "1px solid var(--color-border)" }}
          />
        </label>

        <label className="stack-sm">
          <span>Precio base</span>
          <input
            name="price"
            value={formData.price}
            onChange={handleChange}
            type="number"
            min="0"
            step="0.01"
            placeholder="129.90"
            style={{ padding: "0.9rem 1rem", borderRadius: "1rem", border: "1px solid var(--color-border)" }}
          />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "1rem" }}>
          <label className="stack-sm">
            <span>Género</span>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              style={{ padding: "0.9rem 1rem", borderRadius: "1rem", border: "1px solid var(--color-border)" }}
            >
              <option value="hombre">Hombre</option>
              <option value="mujer">Mujer</option>
              <option value="unisex">Unisex</option>
              <option value="niños">Niños</option>
            </select>
          </label>

          <label className="stack-sm">
            <span>Tipo</span>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              style={{ padding: "0.9rem 1rem", borderRadius: "1rem", border: "1px solid var(--color-border)" }}
            >
              <option value="zapatos">Zapatos</option>
              <option value="ropa">Ropa</option>
              <option value="accesorios">Accesorios</option>
            </select>
          </label>
        </div>

        <button type="submit" className="button-primary">
          Guardar borrador
        </button>
      </div>
    </form>
  );
}

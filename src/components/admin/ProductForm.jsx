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
    <form onSubmit={handleSubmit} className="admin-product-form">
      <div className="admin-product-form__header">
        <strong>Información base</strong>
        <p className="text-muted">
          Formulario inicial para conectar luego con variantes, imágenes y `/api/products`.
        </p>
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
          <span>Precio base</span>
          <input
            name="price"
            value={formData.price}
            onChange={handleChange}
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
            <option value="zapatos">Zapatos</option>
            <option value="ropa">Ropa</option>
            <option value="accesorios">Accesorios</option>
          </select>
        </label>
      </div>

      <div className="admin-product-form__footer">
        <button type="submit">Guardar borrador</button>
      </div>
    </form>
  );
}

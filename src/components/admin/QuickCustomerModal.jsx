"use client";

import { UserPlus, X } from "lucide-react";

export default function QuickCustomerModal({
  action,
  billingRequired = false,
  isPending = false,
  message = "",
  onClose,
  status = "idle",
}) {
  return (
    <div className="admin-sale-modal" role="dialog" aria-modal="true" aria-labelledby="quick-customer-title">
      <form action={action} className="admin-sale-modal__panel">
        <div className="admin-sale-modal__header">
          <div>
            <span className="eyebrow">Cliente</span>
            <h2 id="quick-customer-title">Crear cliente rápido</h2>
          </div>
          <button type="button" className="admin-icon-button admin-icon-button--secondary admin-icon-button--lg" onClick={onClose} aria-label="Cerrar modal">
            <X size={17} strokeWidth={1.9} aria-hidden="true" />
          </button>
        </div>

        <div className="admin-sale-modal__body">
          <div className="admin-sale-form__grid">
            <label>
              <span>Nombre</span>
              <input name="firstName" required />
            </label>
            <label>
              <span>Apellido</span>
              <input name="lastName" required />
            </label>
            <label>
              <span>Correo</span>
              <input type="email" name="email" required />
            </label>
            <label>
              <span>Teléfono</span>
              <input name="phone" required />
            </label>
            <label>
              <span>Documento</span>
              <select name="documentType" defaultValue={billingRequired ? "cedula" : ""} required={billingRequired}>
                <option value="">Sin documento</option>
                <option value="cedula">Cédula</option>
                <option value="ruc">RUC</option>
              </select>
            </label>
            <label>
              <span>Número</span>
              <input name="documentNumber" required={billingRequired} />
            </label>
            <label className="admin-sale-form__wide">
              <span>Nombre para factura</span>
              <input name="taxName" required={billingRequired} />
            </label>
            <label>
              <span>País fiscal</span>
              <input name="billingCountry" defaultValue="Ecuador" required={billingRequired} />
            </label>
            <label>
              <span>Provincia fiscal</span>
              <input name="billingProvince" required={billingRequired} />
            </label>
            <label>
              <span>Ciudad fiscal</span>
              <input name="billingCity" required={billingRequired} />
            </label>
            <label className="admin-sale-form__wide">
              <span>Dirección fiscal</span>
              <input name="billingAddressLine" required={billingRequired} />
            </label>
          </div>

          {message ? (
            <div className={`admin-customer-form__message admin-customer-form__message--${status}`} aria-live="polite">
              {message}
            </div>
          ) : null}
        </div>

        <div className="admin-sale-modal__footer">
          <button type="button" className="admin-button admin-button--secondary admin-button--lg" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="admin-button admin-button--primary admin-button--lg" disabled={isPending}>
            <UserPlus size={16} strokeWidth={1.8} aria-hidden="true" />
            {isPending ? "Creando..." : "Crear cliente"}
          </button>
        </div>
      </form>
    </div>
  );
}

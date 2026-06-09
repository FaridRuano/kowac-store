"use client";

import { Save } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import { createCustomer } from "@/app/admin/clientes/actions";

const initialActionState = {
  errors: {},
  message: "",
  status: "idle",
};

const nationalDocumentTypes = [
  { label: "Cédula", value: "cedula" },
  { label: "RUC", value: "ruc" },
];

const foreignDocumentTypes = [
  { label: "Identificación del exterior", value: "foreign_id" },
];

function FieldError({ errors }) {
  if (!errors?.length) {
    return null;
  }

  return <small className="admin-customer-form__error">{errors[0]}</small>;
}

function normalizeInitialAddress(address, index) {
  return {
    addressLine: address?.addressLine || "",
    city: address?.city || "",
    country: address?.country || "Ecuador",
    id: address?.id || `shipping-existing-${index}`,
    province: address?.province || "",
    reference: address?.reference || "",
  };
}

export default function CustomerForm({
  action = createCustomer,
  cancelHref = "/admin/clientes",
  customer = null,
  mode = "create",
  submitLabel = "Guardar cliente",
}) {
  const [state, formAction, isPending] = useActionState(action, initialActionState);
  const [billingMode, setBillingMode] = useState(customer?.billingMode || "consumer_final");
  const [customerType, setCustomerType] = useState(customer?.customerType || "national");
  const [documentType, setDocumentType] = useState(customer?.documentType || "cedula");
  const [billingCountry, setBillingCountry] = useState(customer?.billingAddress?.country || "Ecuador");
  const [shippingAddresses, setShippingAddresses] = useState(
    (customer?.addresses || []).map((address, index) => normalizeInitialAddress(address, index))
  );
  const [createAccount, setCreateAccount] = useState(false);
  const documentTypes = customerType === "national" ? nationalDocumentTypes : foreignDocumentTypes;
  const isTaxData = billingMode === "tax_data";
  const isEditMode = mode === "edit";

  function handleBillingModeChange(event) {
    const nextMode = event.target.value;

    setBillingMode(nextMode);
    if (nextMode === "consumer_final") {
      setCustomerType("national");
      setDocumentType("cedula");
      setBillingCountry("Ecuador");
    }
  }

  function handleCustomerTypeChange(event) {
    const nextType = event.target.value;

    setCustomerType(nextType);
    setDocumentType(nextType === "national" ? "cedula" : "foreign_id");
    setBillingCountry(nextType === "national" ? "Ecuador" : "");
  }

  function addShippingAddress() {
    setShippingAddresses((current) => [
      ...current,
      {
        id: `shipping-${Date.now()}-${current.length}`,
        country: "Ecuador",
      },
    ]);
  }

  function removeShippingAddress(id) {
    setShippingAddresses((current) => current.filter((address) => address.id !== id));
  }

  return (
    <form action={formAction} className="admin-customer-form">
      <section className="admin-customer-form__section">
        <div className="admin-product-form__header">
          <strong>Contacto básico</strong>
        </div>

        <p className="admin-page__section-summary">
          Estos datos son suficientes para una venta online básica y para contactar al cliente.
        </p>

        <div className="admin-customer-form__grid">
          <label>
            <span>Nombre</span>
            <input name="firstName" placeholder="María" defaultValue={customer?.firstName || ""} required />
            <FieldError errors={state.errors?.firstName} />
          </label>

          <label>
            <span>Apellido</span>
            <input name="lastName" placeholder="Paredes" defaultValue={customer?.lastName || ""} required />
            <FieldError errors={state.errors?.lastName} />
          </label>

          <label>
            <span>Correo electrónico</span>
            <input type="email" name="email" placeholder="cliente@correo.com" defaultValue={customer?.email || ""} required />
            <FieldError errors={state.errors?.email} />
          </label>

          <label>
            <span>Teléfono</span>
            <input name="phone" placeholder="+593 99 000 0000" defaultValue={customer?.phone || ""} required />
            <FieldError errors={state.errors?.phone} />
          </label>
        </div>
      </section>

      <section className="admin-customer-form__section">
        <div className="admin-product-form__header">
          <strong>Direcciones de envío</strong>
        </div>

        <p className="admin-page__section-summary">
          Un cliente puede tener varias direcciones y cada pedido podrá enviarse a una diferente.
        </p>

        <input type="hidden" name="shippingAddressCount" value={shippingAddresses.length} />

        {shippingAddresses.length ? (
          <div className="admin-customer-form__address-list">
            {shippingAddresses.map((address, index) => (
              <div key={address.id} className="admin-customer-form__address-card">
                <div className="admin-customer-form__address-header">
                  <span>Dirección {index + 1}</span>
                  <button type="button" onClick={() => removeShippingAddress(address.id)}>
                    Quitar
                  </button>
                </div>

                <div className="admin-customer-form__grid">
                  <label>
                    <span>País</span>
                    <input name={`shippingCountry_${index}`} defaultValue={address.country || "Ecuador"} placeholder="País" required />
                  </label>

                  <label>
                    <span>Provincia / Estado</span>
                    <input name={`shippingProvince_${index}`} placeholder="Pichincha" defaultValue={address.province || ""} required />
                    <FieldError errors={state.errors?.addresses?.province} />
                  </label>

                  <label>
                    <span>Ciudad</span>
                    <input name={`shippingCity_${index}`} placeholder="Quito" defaultValue={address.city || ""} required />
                    <FieldError errors={state.errors?.addresses?.city} />
                  </label>

                  <label className="admin-customer-form__wide">
                    <span>Dirección</span>
                    <input name={`shippingAddressLine_${index}`} placeholder="Av. Principal N12-34 y Secundaria" defaultValue={address.addressLine || ""} required />
                    <FieldError errors={state.errors?.addresses?.addressLine} />
                  </label>

                  <label className="admin-customer-form__wide">
                    <span>Referencia</span>
                    <textarea name={`shippingReference_${index}`} rows={3} placeholder="Referencia opcional para la entrega" defaultValue={address.reference || ""} />
                  </label>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <button type="button" className="admin-customer-form__secondary-button" onClick={addShippingAddress}>
          Agregar dirección de envío
        </button>
      </section>

      <section className="admin-customer-form__section">
        <div className="admin-product-form__header">
          <strong>Facturación</strong>
        </div>

        <div className="admin-customer-form__segments" role="radiogroup" aria-label="Modo de facturación">
          <label className={billingMode === "consumer_final" ? "is-active" : ""}>
            <input
              type="radio"
              name="billingMode"
              value="consumer_final"
              checked={billingMode === "consumer_final"}
              onChange={handleBillingModeChange}
            />
            <span>Consumidor final</span>
          </label>
          <label className={billingMode === "tax_data" ? "is-active" : ""}>
            <input
              type="radio"
              name="billingMode"
              value="tax_data"
              checked={billingMode === "tax_data"}
              onChange={handleBillingModeChange}
            />
            <span>Factura con datos</span>
          </label>
        </div>

        <p className="admin-page__section-summary">
          {isTaxData
            ? "Usa esta opción cuando el cliente solicita factura con identificación y dirección fiscal."
            : "Para ventas normales puedes registrar al cliente sin pedir cédula, RUC o identificación extranjera."}
        </p>

        {isTaxData ? (
          <>
            <div className="admin-customer-form__segments" role="radiogroup" aria-label="Residencia fiscal">
              <label className={customerType === "national" ? "is-active" : ""}>
                <input
                  type="radio"
                  name="customerType"
                  value="national"
                  checked={customerType === "national"}
                  onChange={handleCustomerTypeChange}
                />
                <span>Nacional</span>
              </label>
              <label className={customerType === "foreign" ? "is-active" : ""}>
                <input
                  type="radio"
                  name="customerType"
                  value="foreign"
                  checked={customerType === "foreign"}
                  onChange={handleCustomerTypeChange}
                />
                <span>Extranjero</span>
              </label>
            </div>

            <div className="admin-customer-form__grid">
              <label>
                <span>Tipo de documento</span>
                <select name="documentType" value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
                  {documentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <FieldError errors={state.errors?.documentType} />
              </label>

              <label>
                <span>Número de documento</span>
                <input
                  name="documentNumber"
                  placeholder={documentType === "ruc" ? "1790012345001" : documentType === "cedula" ? "1712345678" : "ID del exterior"}
                  defaultValue={customer?.documentNumber || ""}
                  required
                />
                <FieldError errors={state.errors?.documentNumber} />
              </label>

              <label className="admin-customer-form__wide">
                <span>Nombre para factura</span>
                <input name="taxName" placeholder="Nombre completo o razón social" defaultValue={customer?.taxName || ""} required />
                <FieldError errors={state.errors?.taxName} />
              </label>

              <label>
                <span>País fiscal</span>
                <input
                  name="billingCountry"
                  value={billingCountry}
                  onChange={(event) => setBillingCountry(event.target.value)}
                  placeholder="País"
                  readOnly={customerType === "national"}
                  required
                />
                <FieldError errors={state.errors?.billingAddress?.country} />
              </label>

              <label>
                <span>Provincia / Estado fiscal</span>
                <input name="billingProvince" placeholder="Pichincha" defaultValue={customer?.billingAddress?.province || ""} required />
                <FieldError errors={state.errors?.billingAddress?.province} />
              </label>

              <label>
                <span>Ciudad fiscal</span>
                <input name="billingCity" placeholder="Quito" defaultValue={customer?.billingAddress?.city || ""} required />
                <FieldError errors={state.errors?.billingAddress?.city} />
              </label>

              <label className="admin-customer-form__wide">
                <span>Dirección fiscal</span>
                <input name="billingAddressLine" placeholder="Av. Principal N12-34 y Secundaria" defaultValue={customer?.billingAddress?.addressLine || ""} required />
                <FieldError errors={state.errors?.billingAddress?.addressLine} />
              </label>
            </div>
          </>
        ) : null}
      </section>

      {!isEditMode ? (
        <section className="admin-customer-form__section">
          <div className="admin-product-form__header">
            <strong>Cuenta de acceso</strong>
          </div>

          <p className="admin-page__section-summary">
            Si activas esta opción, el cliente podrá iniciar sesión con su correo para comprar y revisar su perfil.
          </p>

          <label className={`admin-customer-form__toggle ${createAccount ? "is-active" : ""}`}>
            <input
              type="checkbox"
              name="createAccount"
              checked={createAccount}
              onChange={(event) => setCreateAccount(event.target.checked)}
            />
            <span>Crear cuenta para este cliente</span>
          </label>

          {createAccount ? (
            <div className="admin-customer-form__grid">
              <label className="admin-customer-form__wide">
                <span>Contraseña temporal</span>
                <input
                  type="password"
                  name="accountPassword"
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  required
                />
                <FieldError errors={state.errors?.accountPassword} />
              </label>
            </div>
          ) : null}
        </section>
      ) : null}

      {state.message ? (
        <div className={`admin-customer-form__message admin-customer-form__message--${state.status}`} aria-live="polite">
          {state.message}
        </div>
      ) : null}

      <div className="admin-product-form__footer">
        <Link href={cancelHref} className="admin-product-form__cancel">
          Cancelar
        </Link>
        <button type="submit" disabled={isPending}>
          <Save size={16} strokeWidth={1.8} aria-hidden="true" />
          {isPending ? "Guardando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

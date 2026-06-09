"use client";

import { Plus, Save, Search, Trash2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { createSale, quickCreateSaleCustomer } from "@/app/admin/ventas/actions";
import QuickCustomerModal from "@/components/admin/QuickCustomerModal";

const saleInitialState = {
  errors: {},
  message: "",
  status: "idle",
};

const customerInitialState = {
  errors: {},
  message: "",
  status: "idle",
};

const DEFAULT_TAX_RATE = 15;

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-EC", {
    currency: "USD",
    style: "currency",
  }).format(value || 0);
}

function getVariantLabel(variant) {
  return [variant.productName, variant.size, variant.colorName].filter(Boolean).join(" ");
}

export default function SaleForm({ customers = [], variants = [] }) {
  const [saleState, saleAction, isSalePending] = useActionState(createSale, saleInitialState);
  const [customerState, customerAction, isCustomerPending] = useActionState(quickCreateSaleCustomer, customerInitialState);
  const [customerMode, setCustomerMode] = useState("consumer_final");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [isProductSuggestionsOpen, setIsProductSuggestionsOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [discountType, setDiscountType] = useState("amount");
  const [discountValue, setDiscountValue] = useState("0");
  const [invoiceRequired, setInvoiceRequired] = useState(false);
  const allCustomers = useMemo(() => {
    if (!customerState.customer || customers.some((customer) => customer.id === customerState.customer.id)) {
      return customers;
    }

    return [customerState.customer, ...customers];
  }, [customerState.customer, customers]);
  const effectiveCustomerId = selectedCustomerId || customerState.customer?.id || "";
  const variantsById = useMemo(() => new Map(variants.map((variant) => [variant.id, variant])), [variants]);
  const filteredVariants = useMemo(() => {
    const query = productSearch.trim().toLowerCase();

    if (!query) {
      return variants.slice(0, 40);
    }

    return variants
      .filter((variant) => `${getVariantLabel(variant)} ${variant.sku}`.toLowerCase().includes(query))
      .slice(0, 40);
  }, [productSearch, variants]);
  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();

    if (!query) {
      return allCustomers.slice(0, 30);
    }

    return allCustomers
      .filter((customer) => `${customer.fullName} ${customer.email} ${customer.documentNumber}`.toLowerCase().includes(query))
      .slice(0, 30);
  }, [allCustomers, customerSearch]);
  const totals = useMemo(() => {
    const subtotal = roundMoney(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
    const numericDiscountValue = Number.parseFloat(discountValue || "0");
    const safeDiscountValue = Number.isFinite(numericDiscountValue) && numericDiscountValue > 0 ? numericDiscountValue : 0;
    const rawDiscount = discountType === "percent" ? subtotal * (safeDiscountValue / 100) : safeDiscountValue;
    const discountTotal = roundMoney(Math.min(Math.max(rawDiscount, 0), subtotal));
    const taxableBase = roundMoney(Math.max(subtotal - discountTotal, 0));
    const taxAmount = invoiceRequired ? roundMoney(taxableBase * (DEFAULT_TAX_RATE / 100)) : 0;
    const total = roundMoney(taxableBase + taxAmount);

    return {
      discountTotal,
      subtotal,
      taxAmount,
      total,
    };
  }, [discountType, discountValue, invoiceRequired, items]);

  function addItem() {
    const variant = variantsById.get(selectedVariantId);

    if (!variant) {
      return;
    }

    setItems((current) => {
      if (current.some((item) => item.variantId === variant.id)) {
        return current.map((item) => (
          item.variantId === variant.id
            ? { ...item, quantity: Math.min(item.quantity + 1, variant.stock) }
            : item
        ));
      }

      return [
        ...current,
        {
          colorName: variant.colorName,
          productName: variant.productName,
          quantity: 1,
          size: variant.size,
          sku: variant.sku,
          stock: variant.stock,
          unitPrice: variant.price,
          variantId: variant.id,
        },
      ];
    });
    setSelectedVariantId("");
    setProductSearch("");
    setIsProductSuggestionsOpen(false);
  }

  function handleProductSearchChange(event) {
    setProductSearch(event.target.value);
    setSelectedVariantId("");
    setIsProductSuggestionsOpen(true);
  }

  function selectVariant(variant) {
    setSelectedVariantId(variant.id);
    setProductSearch(getVariantLabel(variant));
    setIsProductSuggestionsOpen(false);
  }

  function handleProductSearchKeyDown(event) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    if (selectedVariantId) {
      addItem();
      return;
    }

    const firstVariant = filteredVariants[0];

    if (firstVariant) {
      selectVariant(firstVariant);
    }
  }

  function updateQuantity(variantId, quantity) {
    const safeQuantity = Number.parseInt(String(quantity || "1"), 10);

    setItems((current) => current.map((item) => (
      item.variantId === variantId
        ? { ...item, quantity: Math.min(Math.max(Number.isInteger(safeQuantity) ? safeQuantity : 1, 1), item.stock) }
        : item
    )));
  }

  function removeItem(variantId) {
    setItems((current) => current.filter((item) => item.variantId !== variantId));
  }

  function handleCustomerModeChange(event) {
    const nextMode = event.target.value;

    setCustomerMode(nextMode);
    if (nextMode === "consumer_final") {
      setSelectedCustomerId("");
      setInvoiceRequired(false);
    }
  }

  return (
    <>
      {isCustomerModalOpen && customerState.status !== "success" ? (
        <QuickCustomerModal
          action={customerAction}
          billingRequired
          isPending={isCustomerPending}
          message={customerState.message}
          onClose={() => setIsCustomerModalOpen(false)}
          status={customerState.status}
        />
      ) : null}

      <form action={saleAction} className="admin-sale-form">
        <input type="hidden" name="items" value={JSON.stringify(items.map((item) => ({ quantity: item.quantity, variantId: item.variantId })))} />
        <input type="hidden" name="customerId" value={effectiveCustomerId} />

        <section className="admin-sale-form__section">
          <div className="admin-product-form__header">
            <strong>Cliente</strong>
            <span>Selecciona consumidor final o datos para facturación.</span>
          </div>

          <div className="admin-customer-form__segments" role="radiogroup" aria-label="Tipo de cliente de la venta">
            <label className={customerMode === "consumer_final" ? "is-active" : ""}>
              <input
                type="radio"
                name="customerMode"
                value="consumer_final"
                checked={customerMode === "consumer_final"}
                onChange={handleCustomerModeChange}
              />
              <span>Consumidor final</span>
            </label>
            <label className={customerMode === "registered" ? "is-active" : ""}>
              <input
                type="radio"
                name="customerMode"
                value="registered"
                checked={customerMode === "registered"}
                onChange={handleCustomerModeChange}
              />
              <span>Con datos</span>
            </label>
          </div>

          {customerMode === "registered" ? (
            <div className="admin-sale-customer-picker">
              <label>
                <span>Buscar cliente</span>
                <div>
                  <Search size={16} strokeWidth={1.8} aria-hidden="true" />
                  <input value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} placeholder="Nombre, email o documento" />
                </div>
              </label>
              <label>
                <span>Cliente</span>
                <select value={effectiveCustomerId} onChange={(event) => setSelectedCustomerId(event.target.value)} required>
                  <option value="">Selecciona un cliente</option>
                  {filteredCustomers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.fullName} / {customer.email}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className="admin-button admin-button--primary admin-button--lg" onClick={() => setIsCustomerModalOpen(true)}>
                <UserPlus size={16} strokeWidth={1.8} aria-hidden="true" />
                Crear rápido
              </button>
            </div>
          ) : null}
        </section>

        <section className="admin-sale-form__section">
          <div className="admin-product-form__header">
            <strong>Productos</strong>
            <span>Agrega una o varias prendas a la venta.</span>
          </div>

          <div className="admin-sale-product-picker admin-sale-product-picker--autocomplete">
            <label className="admin-sale-product-autocomplete">
              <span>Producto</span>
              <div>
                <Search size={16} strokeWidth={1.8} aria-hidden="true" />
                <input
                  value={productSearch}
                  onBlur={() => window.setTimeout(() => setIsProductSuggestionsOpen(false), 140)}
                  onChange={handleProductSearchChange}
                  onFocus={() => setIsProductSuggestionsOpen(true)}
                  onKeyDown={handleProductSearchKeyDown}
                  placeholder="Buscar y seleccionar producto"
                />
                {isProductSuggestionsOpen && filteredVariants.length ? (
                  <div className="admin-sale-product-autocomplete__list">
                    {filteredVariants.map((variant) => (
                      <button
                        key={variant.id}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectVariant(variant)}
                      >
                        {getVariantLabel(variant)}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </label>
            <button type="button" className="admin-button admin-button--primary admin-button--lg" onClick={addItem} disabled={!selectedVariantId}>
              <Plus size={16} strokeWidth={1.8} aria-hidden="true" />
              Agregar
            </button>
          </div>

          {items.length ? (
            <div className="admin-sale-items">
              {items.map((item) => (
                <article key={item.variantId} className="admin-sale-item">
                  <div>
                    <strong>{item.productName}</strong>
                    <span>{item.sku} / {item.colorName || "N/A"} / {item.size || "N/A"}</span>
                  </div>
                  <label>
                    <span>Cantidad</span>
                    <input type="number" min="1" max={item.stock} value={item.quantity} onChange={(event) => updateQuantity(item.variantId, event.target.value)} />
                  </label>
                  <span>{formatMoney(item.unitPrice)}</span>
                  <strong>{formatMoney(item.unitPrice * item.quantity)}</strong>
                  <button type="button" className="admin-icon-button admin-icon-button--danger" onClick={() => removeItem(item.variantId)} aria-label={`Quitar ${item.productName}`}>
                    <Trash2 size={16} strokeWidth={1.8} aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="admin-customer-orders-empty">
              <span>Sin productos agregados</span>
              <small>Selecciona un producto y presiona Agregar para iniciar la venta.</small>
            </div>
          )}
        </section>

        <section className="admin-sale-form__summary">
          <div className="admin-sale-form__section">
            <div className="admin-product-form__header">
              <strong>Descuento y factura</strong>
            </div>

            <div className="admin-sale-form__grid">
              <label>
                <span>Tipo de descuento</span>
                <select name="discountType" value={discountType} onChange={(event) => setDiscountType(event.target.value)}>
                  <option value="amount">Valor</option>
                  <option value="percent">Porcentaje</option>
                </select>
              </label>
              <label>
                <span>{discountType === "percent" ? "Porcentaje" : "Valor"}</span>
                <input name="discountValue" type="number" min="0" step="0.01" value={discountValue} onChange={(event) => setDiscountValue(event.target.value)} />
              </label>
              <label className={`admin-form-checkbox ${invoiceRequired ? "is-active" : ""}`}>
                <input name="invoiceRequired" type="checkbox" checked={invoiceRequired} onChange={(event) => setInvoiceRequired(event.target.checked)} />
                <span>
                  <strong>Factura</strong>
                </span>
              </label>
              <label>
                <span>Método de pago</span>
                <select name="paymentMethod" defaultValue="cash" required>
                  <option value="cash">Efectivo</option>
                  <option value="card">Tarjeta</option>
                  <option value="transfer">Transferencia</option>
                  <option value="mixed">Mixto</option>
                </select>
              </label>
              <label className="admin-sale-form__wide">
                <span>Notas</span>
                <textarea name="notes" rows={3} placeholder="Notas internas opcionales" />
              </label>
            </div>
          </div>

          <aside className="admin-sale-total">
            <span>Subtotal <strong>{formatMoney(totals.subtotal)}</strong></span>
            <span>Descuento <strong>{formatMoney(totals.discountTotal)}</strong></span>
            <span>{invoiceRequired ? `IVA ${DEFAULT_TAX_RATE}%` : "IVA"} <strong>{invoiceRequired ? formatMoney(totals.taxAmount) : "No aplica"}</strong></span>
            <span className="admin-sale-total__main">Total <strong>{formatMoney(totals.total)}</strong></span>
          </aside>
        </section>

        {saleState.message ? (
          <div className={`admin-customer-form__message admin-customer-form__message--${saleState.status}`} aria-live="polite">
            {saleState.message}
          </div>
        ) : null}

        <div className="admin-product-form__footer">
          <Link href="/admin/ventas" className="admin-button admin-button--secondary admin-button--lg">
            Cancelar
          </Link>
          <button type="submit" className="admin-button admin-button--primary admin-button--lg" disabled={isSalePending || !items.length}>
            <Save size={16} strokeWidth={1.8} aria-hidden="true" />
            {isSalePending ? "Guardando..." : "Guardar venta"}
          </button>
        </div>
      </form>
    </>
  );
}

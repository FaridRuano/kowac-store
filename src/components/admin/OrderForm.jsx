"use client";

import { Plus, Save, Search, Trash2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { createOrder, quickCreateOrderCustomer } from "@/app/admin/pedidos/actions";
import QuickCustomerModal from "@/components/admin/QuickCustomerModal";

const orderInitialState = {
  errors: {},
  message: "",
  status: "idle",
};

const DEFAULT_TAX_RATE = 15;
const ECUADOR_PROVINCES = [
  "Azuay",
  "Bolívar",
  "Cañar",
  "Carchi",
  "Chimborazo",
  "Cotopaxi",
  "El Oro",
  "Esmeraldas",
  "Galápagos",
  "Guayas",
  "Imbabura",
  "Loja",
  "Los Ríos",
  "Manabí",
  "Morona Santiago",
  "Napo",
  "Orellana",
  "Pastaza",
  "Pichincha",
  "Santa Elena",
  "Santo Domingo de los Tsáchilas",
  "Sucumbíos",
  "Tungurahua",
  "Zamora Chinchipe",
];

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

function getCustomerLabel(customer) {
  return [customer.fullName, customer.email].filter(Boolean).join(" / ");
}

export default function OrderForm({ customers = [], variants = [] }) {
  const [orderState, orderAction, isOrderPending] = useActionState(createOrder, orderInitialState);
  const [customerState, customerAction, isCustomerPending] = useActionState(quickCreateOrderCustomer, orderInitialState);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCustomerSuggestionsOpen, setIsCustomerSuggestionsOpen] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState("shipping");
  const [addressMode, setAddressMode] = useState("saved");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [isProductSuggestionsOpen, setIsProductSuggestionsOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [discountType, setDiscountType] = useState("amount");
  const [discountValue, setDiscountValue] = useState("0");
  const [shippingCost, setShippingCost] = useState("0");
  const [customRecipientEnabled, setCustomRecipientEnabled] = useState(false);
  const [invoiceRequired, setInvoiceRequired] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const allCustomers = useMemo(() => {
    if (!customerState.customer || customers.some((customer) => customer.id === customerState.customer.id)) {
      return customers;
    }

    return [customerState.customer, ...customers];
  }, [customerState.customer, customers]);
  const effectiveCustomerId = selectedCustomerId || customerState.customer?.id || "";
  const effectiveCustomerSearch = customerSearch || (!selectedCustomerId && customerState.customer ? getCustomerLabel(customerState.customer) : "");
  const customersById = useMemo(() => new Map(allCustomers.map((customer) => [customer.id, customer])), [allCustomers]);
  const selectedCustomer = customersById.get(effectiveCustomerId) || null;
  const selectedAddress = selectedCustomer?.addresses?.find((address) => address.id === selectedAddressId) || null;
  const variantsById = useMemo(() => new Map(variants.map((variant) => [variant.id, variant])), [variants]);
  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();

    if (!query) {
      return allCustomers.slice(0, 30);
    }

    return allCustomers
      .filter((customer) => `${customer.fullName} ${customer.email} ${customer.phone} ${customer.documentNumber}`.toLowerCase().includes(query))
      .slice(0, 30);
  }, [allCustomers, customerSearch]);
  const filteredVariants = useMemo(() => {
    const query = productSearch.trim().toLowerCase();

    if (!query) {
      return variants.slice(0, 40);
    }

    return variants
      .filter((variant) => `${getVariantLabel(variant)} ${variant.sku}`.toLowerCase().includes(query))
      .slice(0, 40);
  }, [productSearch, variants]);
  const totals = useMemo(() => {
    const subtotal = roundMoney(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
    const numericDiscountValue = Number.parseFloat(discountValue || "0");
    const safeDiscountValue = Number.isFinite(numericDiscountValue) && numericDiscountValue > 0 ? numericDiscountValue : 0;
    const rawDiscount = discountType === "percent" ? subtotal * (safeDiscountValue / 100) : safeDiscountValue;
    const discount = roundMoney(Math.min(Math.max(rawDiscount, 0), subtotal));
    const taxableBase = roundMoney(Math.max(subtotal - discount, 0));
    const taxAmount = invoiceRequired ? roundMoney(taxableBase * (DEFAULT_TAX_RATE / 100)) : 0;
    const numericShippingCost = Number.parseFloat(shippingCost || "0");
    const safeShippingCost = deliveryMethod === "shipping" && Number.isFinite(numericShippingCost) && numericShippingCost > 0 ? numericShippingCost : 0;
    const total = roundMoney(taxableBase + taxAmount + safeShippingCost);

    return {
      discount,
      shippingCost: safeShippingCost,
      subtotal,
      taxAmount,
      total,
    };
  }, [deliveryMethod, discountType, discountValue, invoiceRequired, items, shippingCost]);

  function selectCustomer(customer) {
    setSelectedCustomerId(customer.id);
    setCustomerSearch(getCustomerLabel(customer));
    setSelectedAddressId(customer.addresses?.find((address) => address.isDefault)?.id || customer.addresses?.[0]?.id || "");
    setAddressMode(customer.addresses?.length ? "saved" : "manual");
    setIsCustomerSuggestionsOpen(false);
  }

  function handleCustomerSearchChange(event) {
    setCustomerSearch(event.target.value);
    setSelectedCustomerId("");
    setSelectedAddressId("");
    setIsCustomerSuggestionsOpen(true);
  }

  function selectVariant(variant) {
    setSelectedVariantId(variant.id);
    setProductSearch(getVariantLabel(variant));
    setIsProductSuggestionsOpen(false);
  }

  function addItem() {
    const variant = variantsById.get(selectedVariantId);

    if (!variant) {
      return;
    }

    setItems((current) => {
      if (current.some((item) => item.variantId === variant.id)) {
        return current.map((item) => (
          item.variantId === variant.id
            ? { ...item, quantity: item.quantity + 1 }
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
          productionNote: "",
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
        ? { ...item, quantity: Math.max(Number.isInteger(safeQuantity) ? safeQuantity : 1, 1) }
        : item
    )));
  }

  function removeItem(variantId) {
    setItems((current) => current.filter((item) => item.variantId !== variantId));
  }

  function updateProductionNote(variantId, productionNote) {
    setItems((current) => current.map((item) => (
      item.variantId === variantId
        ? { ...item, productionNote }
        : item
    )));
  }

  return (
    <>
      {isCustomerModalOpen && customerState.status !== "success" ? (
        <QuickCustomerModal
          action={customerAction}
          isPending={isCustomerPending}
          message={customerState.message}
          onClose={() => setIsCustomerModalOpen(false)}
          status={customerState.status}
        />
      ) : null}

    <form action={orderAction} className="admin-sale-form">
      <input type="hidden" name="items" value={JSON.stringify(items.map((item) => ({ productionNote: item.productionNote || "", quantity: item.quantity, variantId: item.variantId })))} />
      <input type="hidden" name="customerId" value={effectiveCustomerId} />

      <section className="admin-sale-form__section">
        <div className="admin-product-form__header">
          <strong>Cliente</strong>
          <span>El pedido necesita cliente registrado con correo y teléfono.</span>
        </div>

        <div className="admin-sale-product-picker admin-sale-product-picker--autocomplete">
          <label className="admin-sale-product-autocomplete">
            <span>Cliente</span>
            <div>
              <Search size={16} strokeWidth={1.8} aria-hidden="true" />
              <input
                value={effectiveCustomerSearch}
                onBlur={() => window.setTimeout(() => setIsCustomerSuggestionsOpen(false), 140)}
                onChange={handleCustomerSearchChange}
                onFocus={() => setIsCustomerSuggestionsOpen(true)}
                placeholder="Buscar por nombre, correo o teléfono"
              />
              {isCustomerSuggestionsOpen && filteredCustomers.length ? (
                <div className="admin-sale-product-autocomplete__list">
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectCustomer(customer)}
                    >
                      {getCustomerLabel(customer)}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </label>
          <button type="button" className="admin-button admin-button--primary admin-button--lg" onClick={() => setIsCustomerModalOpen(true)}>
            <UserPlus size={16} strokeWidth={1.8} aria-hidden="true" />
            Crear cliente
          </button>
        </div>

        {selectedCustomer ? (
          <div className="admin-order-customer-summary">
            <div className="admin-order-customer-summary__main">
              <span>Cliente</span>
              <strong>{selectedCustomer.fullName || "Cliente sin nombre"}</strong>
            </div>
            <div>
              <span>Correo</span>
              <small>{selectedCustomer.email}</small>
            </div>
            <div>
              <span>Teléfono</span>
              <small>{selectedCustomer.phone || "Sin teléfono"}</small>
            </div>
            <div>
              <span>Documento</span>
              <small>{selectedCustomer.documentNumber || "Sin documento"}</small>
            </div>
          </div>
        ) : null}
      </section>

      <section className="admin-sale-form__section">
        <div className="admin-product-form__header">
          <strong>Entrega</strong>
          <span>Selecciona si el pedido se envía o se retira en local.</span>
        </div>

        <div className="admin-customer-form__segments" role="radiogroup" aria-label="Método de entrega">
          <label className={deliveryMethod === "shipping" ? "is-active" : ""}>
            <input
              type="radio"
              name="deliveryMethod"
              value="shipping"
              checked={deliveryMethod === "shipping"}
              onChange={() => setDeliveryMethod("shipping")}
            />
            <span>Envío</span>
          </label>
          <label className={deliveryMethod === "pickup" ? "is-active" : ""}>
            <input
              type="radio"
              name="deliveryMethod"
              value="pickup"
              checked={deliveryMethod === "pickup"}
              onChange={() => setDeliveryMethod("pickup")}
            />
            <span>Retiro en local</span>
          </label>
        </div>

        {deliveryMethod === "shipping" ? (
          <>
            {selectedCustomer?.addresses?.length ? (
              <div className="admin-customer-form__segments" role="radiogroup" aria-label="Tipo de dirección">
                <label className={addressMode === "saved" ? "is-active" : ""}>
                  <input
                    type="radio"
                    value="saved"
                    checked={addressMode === "saved"}
                    onChange={() => setAddressMode("saved")}
                  />
                  <span>Dirección guardada</span>
                </label>
                <label className={addressMode === "manual" ? "is-active" : ""}>
                  <input
                    type="radio"
                    value="manual"
                    checked={addressMode === "manual"}
                    onChange={() => setAddressMode("manual")}
                  />
                  <span>Manual</span>
                </label>
              </div>
            ) : null}

            {addressMode === "saved" && selectedCustomer?.addresses?.length ? (
              <div className="admin-sale-form__grid">
                <label className="admin-sale-form__wide">
                  <span>Dirección de envío</span>
                  <select value={selectedAddressId} onChange={(event) => setSelectedAddressId(event.target.value)} required>
                    <option value="">Selecciona una dirección</option>
                    {selectedCustomer.addresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {[address.city, address.province, address.addressLine].filter(Boolean).join(" / ")}
                      </option>
                    ))}
                  </select>
                </label>
                <input type="hidden" name="shippingCountry" value={selectedAddress?.country || "Ecuador"} />
                <input type="hidden" name="shippingProvince" value={selectedAddress?.province || ""} />
                <input type="hidden" name="shippingCity" value={selectedAddress?.city || ""} />
                <input type="hidden" name="shippingPostalCode" value={selectedAddress?.postalCode || ""} />
                <input type="hidden" name="shippingAddressLine" value={selectedAddress?.addressLine || ""} />
                <input type="hidden" name="shippingReference" value={selectedAddress?.reference || ""} />
              </div>
            ) : (
              <div className="admin-sale-form__grid">
                <label>
                  <span>País</span>
                  <input value="Ecuador" disabled readOnly />
                  <input type="hidden" name="shippingCountry" value="Ecuador" />
                </label>
                <label>
                  <span>Provincia</span>
                  <select name="shippingProvince" defaultValue="" required={deliveryMethod === "shipping"}>
                    <option value="">Selecciona una provincia</option>
                    {ECUADOR_PROVINCES.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Ciudad</span>
                  <input name="shippingCity" required={deliveryMethod === "shipping"} />
                </label>
                <label>
                  <span>Código postal</span>
                  <input name="shippingPostalCode" placeholder="Opcional" />
                </label>
                <label className="admin-sale-form__wide">
                  <span>Dirección</span>
                  <input name="shippingAddressLine" required={deliveryMethod === "shipping"} />
                </label>
                <label className="admin-sale-form__wide">
                  <span>Referencia</span>
                  <input name="shippingReference" />
                </label>
              </div>
            )}

            <div className={`admin-sale-recipient-grid ${customRecipientEnabled ? "is-expanded" : ""}`}>
              <label className={`admin-form-checkbox ${customRecipientEnabled ? "is-active" : ""}`}>
                <input
                  name="shippingRecipientEnabled"
                  type="checkbox"
                  checked={customRecipientEnabled}
                  onChange={(event) => setCustomRecipientEnabled(event.target.checked)}
                />
                <span>
                  <strong>Recibe otra persona</strong>
                </span>
              </label>

              {customRecipientEnabled ? (
                <>
                  <label>
                    <span>Nombre de quien recibe</span>
                    <input name="shippingRecipientName" required />
                  </label>
                  <label>
                    <span>Identificación</span>
                    <input name="shippingRecipientDocumentNumber" required />
                  </label>
                </>
              ) : null}
            </div>
          </>
        ) : null}
      </section>

      <section className="admin-sale-form__section">
        <div className="admin-product-form__header">
          <strong>Productos</strong>
          <span>Agrega los modelos y variantes que se pedirán a fábrica.</span>
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
              <article key={item.variantId} className="admin-sale-item admin-order-form-item">
                <div>
                  <strong>{item.productName}</strong>
                  <span>{item.sku} / {item.colorName || "N/A"} / {item.size || "N/A"}</span>
                </div>
                <label>
                  <span>Cantidad</span>
                  <input type="number" min="1" value={item.quantity} onChange={(event) => updateQuantity(item.variantId, event.target.value)} />
                </label>
                <span>{formatMoney(item.unitPrice)}</span>
                <strong>{formatMoney(item.unitPrice * item.quantity)}</strong>
                <button type="button" className="admin-icon-button admin-icon-button--danger" onClick={() => removeItem(item.variantId)} aria-label={`Quitar ${item.productName}`}>
                  <Trash2 size={16} strokeWidth={1.8} aria-hidden="true" />
                </button>
                <label className="admin-order-form-item__note">
                  <span>Nota para fábrica</span>
                  <textarea
                    rows={2}
                    value={item.productionNote || ""}
                    onChange={(event) => updateProductionNote(item.variantId, event.target.value)}
                    placeholder="Personalización, ajuste, material, acabado o cualquier indicación especial"
                  />
                </label>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-customer-orders-empty">
            <span>Sin productos agregados</span>
            <small>Selecciona un producto y presiona Agregar para iniciar el pedido.</small>
          </div>
        )}
      </section>

      <section className="admin-sale-form__summary">
        <div className="admin-sale-form__section">
          <div className="admin-product-form__header">
            <strong>Pago y factura</strong>
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
            {deliveryMethod === "shipping" ? (
              <label>
                <span>Costo de envío</span>
                <input name="shippingCost" type="number" min="0" step="0.01" value={shippingCost} onChange={(event) => setShippingCost(event.target.value)} />
              </label>
            ) : null}
            <label className={`admin-form-checkbox ${invoiceRequired ? "is-active" : ""}`}>
              <input name="invoiceRequired" type="checkbox" checked={invoiceRequired} onChange={(event) => setInvoiceRequired(event.target.checked)} />
              <span>
                <strong>Factura</strong>
              </span>
            </label>
            <label>
              <span>Método de pago</span>
              <select name="paymentMethod" defaultValue="transferencia" required>
                <option value="transferencia">Transferencia</option>
                <option value="payphone">PayPhone</option>
                <option value="datafast">Datafast</option>
                <option value="stripe">Stripe</option>
                <option value="manual">Manual</option>
              </select>
            </label>
            <label>
              <span>Estado de pago</span>
              <select name="paymentStatus" value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)} required>
                <option value="pending">Pendiente</option>
                <option value="partial">Abonado</option>
                <option value="paid">Pagado</option>
              </select>
            </label>
            {paymentStatus === "partial" ? (
              <label>
                <span>Valor abonado</span>
                <input name="paymentDepositAmount" type="number" min="0.01" step="0.01" required />
              </label>
            ) : null}
            <label>
              <span>Estado inicial</span>
              <select name="orderStatus" defaultValue="pending" required>
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmado</option>
                <option value="preparing">Preparando</option>
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
          <span>Descuento <strong>{formatMoney(totals.discount)}</strong></span>
          <span>Envío <strong>{deliveryMethod === "shipping" ? formatMoney(totals.shippingCost) : "Retiro"}</strong></span>
          <span>{invoiceRequired ? `IVA ${DEFAULT_TAX_RATE}%` : "IVA"} <strong>{invoiceRequired ? formatMoney(totals.taxAmount) : "No aplica"}</strong></span>
          <span className="admin-sale-total__main">Total <strong>{formatMoney(totals.total)}</strong></span>
        </aside>
      </section>

      {orderState.message ? (
        <div className={`admin-customer-form__message admin-customer-form__message--${orderState.status}`} aria-live="polite">
          {orderState.message}
        </div>
      ) : null}

      <div className="admin-product-form__footer">
        <Link href="/admin/pedidos" className="admin-button admin-button--secondary admin-button--lg">
          Cancelar
        </Link>
        <button type="submit" className="admin-button admin-button--primary admin-button--lg" disabled={isOrderPending || !items.length || !effectiveCustomerId}>
          <Save size={16} strokeWidth={1.8} aria-hidden="true" />
          {isOrderPending ? "Guardando..." : "Guardar pedido"}
        </button>
      </div>
    </form>
    </>
  );
}

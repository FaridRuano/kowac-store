import { ArrowLeft, CalendarClock, Mail, MapPin, PackageCheck, Pencil, Phone, Plus, ReceiptText, Wallet } from "lucide-react";
import { isValidObjectId } from "mongoose";
import Link from "next/link";
import { notFound } from "next/navigation";

import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";
import Order from "@/models/Order";

export const metadata = {
  title: "Detalle de cliente | Admin Kowac",
};

function formatDate(value) {
  if (!value) {
    return "S/F";
  }

  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-EC", {
    currency: "USD",
    style: "currency",
  }).format(value || 0);
}

function formatOrderStatus(value) {
  const statuses = {
    cancelled: "Cancelado",
    confirmed: "Confirmado",
    delivered: "Entregado",
    pending: "Pendiente",
    preparing: "Preparando",
    shipped: "Enviado",
  };

  return statuses[value] || value || "Sin estado";
}

function formatPaymentStatus(value) {
  const statuses = {
    failed: "Fallido",
    paid: "Pagado",
    pending: "Pendiente",
    refunded: "Reembolsado",
  };

  return statuses[value] || value || "Sin estado";
}

function formatCustomerType(value) {
  return value === "foreign" ? "Extranjero" : "Nacional";
}

function formatBillingMode(value) {
  return value === "tax_data" ? "Factura con datos" : "Consumidor final";
}

function formatDocumentType(value) {
  const types = {
    cedula: "Cédula",
    foreign_id: "ID extranjero",
    passport: "Pasaporte",
    ruc: "RUC",
  };

  return types[value] || value || "Sin documento";
}

async function getCustomerDetail(customerId) {
  if (!isValidObjectId(customerId)) {
    notFound();
  }

  await connectDB();

  const customer = await Customer.findById(customerId).lean();

  if (!customer) {
    notFound();
  }

  const orders = await Order.find({ "customer.email": customer.email })
    .select("orderNumber total paymentStatus orderStatus paymentMethod createdAt items shippingAddress")
    .sort({ createdAt: -1 })
    .lean();

  return {
    addresses: (customer.addresses || []).map((address, index) => ({
      addressLine: address.addressLine,
      city: address.city,
      country: address.country || "Ecuador",
      id: `${address.addressLine}-${index}`,
      isDefault: address.isDefault,
      province: address.province,
      reference: address.reference,
    })),
    billingAddress: customer.billingAddress
      ? {
          addressLine: customer.billingAddress.addressLine,
          city: customer.billingAddress.city,
          country: customer.billingAddress.country || "Ecuador",
          province: customer.billingAddress.province,
        }
      : null,
    createdAt: customer.createdAt,
    billingMode: customer.billingMode || "consumer_final",
    customerType: customer.customerType || "national",
    documentNumber: customer.documentNumber || "",
    documentType: customer.documentType || "",
    email: customer.email,
    fullName: `${customer.firstName} ${customer.lastName}`.trim(),
    hasAccount: Boolean(customer.user),
    id: customer._id.toString(),
    orders: orders.map((order) => ({
      createdAt: order.createdAt,
      id: order._id.toString(),
      itemsCount: order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      shippingCity: order.shippingAddress?.city || "",
      total: order.total,
    })),
    phone: customer.phone,
    taxName: customer.taxName || `${customer.firstName} ${customer.lastName}`.trim(),
    totalItems: orders.reduce(
      (sum, order) => sum + (order.items?.reduce((itemsSum, item) => itemsSum + (item.quantity || 0), 0) || 0),
      0
    ),
    totalSpent: orders.reduce((sum, order) => sum + (order.total || 0), 0),
    updatedAt: customer.updatedAt,
  };
}

export default async function AdminCustomerDetailPage({ params }) {
  const { customerId } = await params;
  const customer = await getCustomerDetail(customerId);
  const lastOrder = customer.orders[0];

  return (
    <div className="admin-page">
      <Link href="/admin/clientes" className="admin-page__action-pill admin-page__back-link">
        <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
        Volver a clientes
      </Link>

      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Cliente</span>
          <h1>{customer.fullName}</h1>
          <p className="text-muted">
            Ficha comercial para revisar compras, contacto, facturación, envíos e historial.
          </p>
        </div>
        <div className="admin-page__header-actions">
          <Link href={`/admin/clientes/${customer.id}/editar`} className="admin-page__action-pill">
            <Pencil size={15} strokeWidth={1.8} aria-hidden="true" />
            Editar
          </Link>
        </div>
      </div>

      <section className="admin-customer-purchase-stats" aria-label="Estadísticas de compras">
        <article className="admin-customer-purchase-stat">
          <ReceiptText size={21} strokeWidth={1.8} aria-hidden="true" />
          <div>
            <span>Cantidad de compras</span>
            <strong>{customer.orders.length}</strong>
            <small>Pedido(s) registrados</small>
          </div>
        </article>
        <article className="admin-customer-purchase-stat admin-customer-purchase-stat--primary">
          <Wallet size={21} strokeWidth={1.8} aria-hidden="true" />
          <div>
            <span>Valor de compras</span>
            <strong>{formatMoney(customer.totalSpent)}</strong>
            <small>Total histórico comprado</small>
          </div>
        </article>
        <article className="admin-customer-purchase-stat">
          <PackageCheck size={21} strokeWidth={1.8} aria-hidden="true" />
          <div>
            <span>Unidades compradas</span>
            <strong>{customer.totalItems}</strong>
            <small>Artículo(s) acumulados</small>
          </div>
        </article>
        <article className="admin-customer-purchase-stat">
          <CalendarClock size={21} strokeWidth={1.8} aria-hidden="true" />
          <div>
            <span>Última compra</span>
            <strong className={!lastOrder ? "admin-customer-purchase-stat__empty-value" : ""}>
              {formatDate(lastOrder?.createdAt)}
            </strong>
            <small>{lastOrder?.orderNumber || "Sin pedidos"}</small>
          </div>
        </article>
      </section>

      <section className="admin-customer-detail__panel">
        <div className="admin-customer-section-heading">
          <div>
            <span className="eyebrow">Contacto</span>
            <h2>Información de contacto</h2>
          </div>
        </div>

        <div className="admin-customer-contact-grid">
          <span>
            <Mail size={16} strokeWidth={1.8} aria-hidden="true" />
            <span>Correo</span>
            <small>{customer.email}</small>
          </span>
          <span>
            <Phone size={16} strokeWidth={1.8} aria-hidden="true" />
            <span>Teléfono</span>
            <small>{customer.phone || "Sin teléfono registrado"}</small>
          </span>
          <span>
            <ReceiptText size={16} strokeWidth={1.8} aria-hidden="true" />
            <span>Cuenta</span>
            <small>{customer.hasAccount ? "Cuenta de acceso activa" : "Sin cuenta de acceso"}</small>
          </span>
          <span>
            <CalendarClock size={16} strokeWidth={1.8} aria-hidden="true" />
            <span>Registro</span>
            <small>{formatDate(customer.createdAt)}</small>
          </span>
        </div>
      </section>

      <section className="admin-customer-detail__panel">
        <div className="admin-customer-section-heading">
          <div>
            <span className="eyebrow">Facturación</span>
            <h2>Información de facturación</h2>
          </div>
        </div>

        <div className="admin-customer-billing">
          <div>
            <span>Modo</span>
            <small>{formatBillingMode(customer.billingMode)}</small>
          </div>
          <div>
            <span>Cliente</span>
            <small>{customer.billingMode === "tax_data" ? formatCustomerType(customer.customerType) : "Consumidor final"}</small>
          </div>
          <div>
            <span>Documento</span>
            <small>{customer.billingMode === "tax_data" ? formatDocumentType(customer.documentType) : "No requerido"}</small>
          </div>
          <div>
            <span>Número</span>
            <small>{customer.billingMode === "tax_data" ? customer.documentNumber || "Sin registrar" : "9999999999999"}</small>
          </div>
          <div>
            <span>Nombre para factura</span>
            <small>{customer.billingMode === "tax_data" ? customer.taxName : "Consumidor final"}</small>
          </div>
          <div>
            <span>Dirección fiscal</span>
            <small>
              {customer.billingMode === "tax_data" && customer.billingAddress
                ? `${customer.billingAddress.addressLine}, ${customer.billingAddress.city}, ${customer.billingAddress.province}, ${customer.billingAddress.country}`
                : "No requerida para consumidor final"}
            </small>
          </div>
        </div>
      </section>

      <section className="admin-customer-detail__panel">
        <div className="admin-customer-section-heading">
          <div>
            <span className="eyebrow">Envíos</span>
            <h2>Direcciones de envío</h2>
          </div>
          <Link href={`/admin/clientes/${customer.id}/direcciones/nueva`} className="admin-page__action-pill">
            <Plus size={15} strokeWidth={1.8} aria-hidden="true" />
            Agregar
          </Link>
        </div>

        {customer.addresses.length ? (
          <div className="admin-customer-address-grid">
            {customer.addresses.map((address) => (
              <article key={address.id} className="admin-customer-address">
                <MapPin size={18} strokeWidth={1.8} aria-hidden="true" />
                <div>
                  <span>
                    {address.city}, {address.province}, {address.country}
                  </span>
                  <small>{address.addressLine}</small>
                  {address.reference ? <small>{address.reference}</small> : null}
                  {address.isDefault ? <em>Predeterminada</em> : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-customer-address-empty">
            <span>Sin direcciones registradas</span>
          </div>
        )}
      </section>

      <section className="admin-customer-detail__panel">
        <div className="admin-customer-section-heading">
          <div>
            <span className="eyebrow">Pedidos</span>
            <h2>Historial comercial</h2>
          </div>
          <Link href="/admin/pedidos" className="admin-catalog-panel__link">
            Ver pedidos
          </Link>
        </div>

        {customer.orders.length ? (
          <div className="admin-page__table-wrap">
            <table className="admin-page__table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Fecha</th>
                  <th>Artículos</th>
                  <th>Total</th>
                  <th>Pago</th>
                  <th>Estado</th>
                  <th>Destino</th>
                </tr>
              </thead>
              <tbody>
                {customer.orders.map((order) => (
                  <tr key={order.id}>
                    <td className="admin-page__primary-cell">
                      <strong>{order.orderNumber}</strong>
                      <span>{order.paymentMethod}</span>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>{order.itemsCount}</td>
                    <td>{formatMoney(order.total)}</td>
                    <td>{formatPaymentStatus(order.paymentStatus)}</td>
                    <td>
                      <span className={`admin-page__status ${order.orderStatus === "delivered" || order.orderStatus === "confirmed" ? "admin-page__status--success" : "admin-page__status--muted"}`}>
                        {formatOrderStatus(order.orderStatus)}
                      </span>
                    </td>
                    <td>{order.shippingCity || "Sin ciudad"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-customer-orders-empty">
            <span>Sin pedidos todavía</span>
            <small>El historial se llenará automáticamente cuando existan pedidos con este email.</small>
          </div>
        )}
      </section>
    </div>
  );
}

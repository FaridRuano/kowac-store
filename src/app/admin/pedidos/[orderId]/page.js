import { ArrowLeft, CalendarClock, Mail, MapPin, PackageCheck, Phone, ReceiptText, Truck, Wallet } from "lucide-react";
import { isValidObjectId } from "mongoose";
import Link from "next/link";
import { notFound } from "next/navigation";

import { connectDB } from "@/lib/db";
import Order from "@/models/Order";

export const metadata = {
  title: "Detalle de pedido | Admin Kowac",
};

const orderStatusLabels = {
  cancelled: "Cancelado",
  confirmed: "Confirmado",
  delivered: "Entregado",
  pending: "Pendiente",
  preparing: "Preparando",
  shipped: "Enviado",
};

const paymentStatusLabels = {
  failed: "Fallido",
  paid: "Pagado",
  partial: "Abonado",
  pending: "Pendiente",
  refunded: "Reembolsado",
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

function getStatusClass(status) {
  if (["confirmed", "delivered", "paid"].includes(status)) {
    return "admin-page__status--success";
  }

  if (["cancelled", "failed", "refunded"].includes(status)) {
    return "admin-page__status--danger";
  }

  if (["partial", "preparing", "shipped"].includes(status)) {
    return "admin-page__status--warning";
  }

  return "admin-page__status--muted";
}

async function getOrder(orderId) {
  if (!isValidObjectId(orderId)) {
    notFound();
  }

  await connectDB();

  const order = await Order.findById(orderId).lean();

  if (!order) {
    notFound();
  }

  return {
    createdAt: order.createdAt,
    customer: {
      email: order.customer?.email || "",
      fullName: `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim(),
      phone: order.customer?.phone || "",
    },
    discount: order.discount || 0,
    deliveryMethod: order.deliveryMethod || "shipping",
    id: order._id.toString(),
    invoiceRequired: Boolean(order.invoiceRequired),
    invoiceStatus: order.invoiceStatus || "not_required",
    items: (order.items || []).map((item, index) => ({
      colorName: item.colorName,
      id: `${item.sku}-${index}`,
      productName: item.productName,
      productionNote: item.productionNote || "",
      quantity: item.quantity || 0,
      size: item.size,
      sku: item.sku,
      total: item.total || 0,
      unitPrice: item.unitPrice || 0,
    })),
    notes: order.notes || "",
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    orderType: order.orderType || "production_order",
    paymentDepositAmount: order.paymentDepositAmount || 0,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    shipment: {
      courier: order.shipment?.courier || "",
      trackingNumber: order.shipment?.trackingNumber || "",
      trackingUrl: order.shipment?.trackingUrl || "",
    },
    shippingAddress: {
      addressLine: order.shippingAddress?.addressLine || "",
      city: order.shippingAddress?.city || "",
      country: order.shippingAddress?.country || "Ecuador",
      postalCode: order.shippingAddress?.postalCode || "",
      province: order.shippingAddress?.province || "",
      reference: order.shippingAddress?.reference || "",
    },
    shippingRecipient: {
      documentNumber: order.shippingRecipient?.documentNumber || "",
      enabled: Boolean(order.shippingRecipient?.enabled),
      fullName: order.shippingRecipient?.fullName || "",
    },
    shippingCost: order.shippingCost || 0,
    subtotal: order.subtotal || 0,
    taxAmount: order.taxAmount || 0,
    taxEnabled: Boolean(order.taxEnabled),
    taxRate: order.taxRate || 0,
    total: order.total || 0,
    updatedAt: order.updatedAt,
  };
}

export default async function AdminOrderDetailPage({ params }) {
  const { orderId } = await params;
  const order = await getOrder(orderId);
  const isOnlineSale = order.orderType === "online_sale";
  const backHref = isOnlineSale ? "/admin/ventas-online" : "/admin/pedidos";
  const backLabel = isOnlineSale ? "Volver a ventas online" : "Volver a pedidos";
  const entityLabel = isOnlineSale ? "Venta online" : "Pedido";
  const statusHelper = isOnlineSale ? "Preparación de la venta" : "Preparación del pedido";
  const detailCopy = isOnlineSale
    ? "Revisa cliente, artículos, pago y datos de envío antes de despachar la venta online."
    : "Revisa cliente, artículos, pago y datos de envío antes de preparar la orden de producción.";

  return (
    <div className="admin-page">
      <Link href={backHref} className="admin-page__action-pill admin-page__back-link">
        <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
        {backLabel}
      </Link>

      <div className="admin-page__header">
        <div>
          <span className="eyebrow">{entityLabel}</span>
          <h1>{order.orderNumber}</h1>
          <p className="text-muted">{detailCopy}</p>
        </div>
      </div>

      <section className="admin-customer-purchase-stats" aria-label="Resumen del pedido">
        <article className="admin-customer-purchase-stat">
          <CalendarClock size={21} strokeWidth={1.8} aria-hidden="true" />
          <div>
            <span>Fecha</span>
            <strong className="admin-customer-purchase-stat__empty-value">{formatDate(order.createdAt)}</strong>
            <small>Última actualización {formatDate(order.updatedAt)}</small>
          </div>
        </article>
        <article className="admin-customer-purchase-stat admin-customer-purchase-stat--primary">
          <Wallet size={21} strokeWidth={1.8} aria-hidden="true" />
          <div>
            <span>Total</span>
            <strong>{formatMoney(order.total)}</strong>
            <small>{paymentStatusLabels[order.paymentStatus] || "Sin estado"}</small>
          </div>
        </article>
        <article className="admin-customer-purchase-stat">
          <PackageCheck size={21} strokeWidth={1.8} aria-hidden="true" />
          <div>
            <span>Estado</span>
            <strong className="admin-customer-purchase-stat__empty-value">{orderStatusLabels[order.orderStatus] || "Sin estado"}</strong>
            <small>{statusHelper}</small>
          </div>
        </article>
        <article className="admin-customer-purchase-stat">
          <ReceiptText size={21} strokeWidth={1.8} aria-hidden="true" />
          <div>
            <span>Artículos</span>
            <strong>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</strong>
            <small>{order.items.length} línea(s)</small>
          </div>
        </article>
      </section>

      <section className="admin-customer-detail__panel">
        <div className="admin-customer-section-heading">
          <div>
            <span className="eyebrow">Cliente</span>
            <h2>Información de contacto</h2>
          </div>
        </div>

        <div className="admin-customer-contact-grid">
          <span>
            <Mail size={16} strokeWidth={1.8} aria-hidden="true" />
            <span>Correo</span>
            <small>{order.customer.email}</small>
          </span>
          <span>
            <Phone size={16} strokeWidth={1.8} aria-hidden="true" />
            <span>Teléfono</span>
            <small>{order.customer.phone || "Sin teléfono registrado"}</small>
          </span>
          <span>
            <ReceiptText size={16} strokeWidth={1.8} aria-hidden="true" />
            <span>Cliente</span>
            <small>{order.customer.fullName || "Sin nombre"}</small>
          </span>
          <span>
            <Wallet size={16} strokeWidth={1.8} aria-hidden="true" />
            <span>Pago</span>
            <small>{order.paymentMethod}</small>
          </span>
        </div>
      </section>

      <section className="admin-customer-detail__panel">
        <div className="admin-customer-section-heading">
          <div>
            <span className="eyebrow">Artículos</span>
            <h2>Productos del pedido</h2>
          </div>
        </div>

        <div className="admin-page__table-wrap">
          <table className="admin-page__table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th>Color</th>
                <th>Talla</th>
                <th>Cantidad</th>
                <th>Nota fábrica</th>
                <th>Precio</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="admin-page__primary-cell">
                    <strong>{item.productName}</strong>
                    <span>{item.sku}</span>
                  </td>
                  <td>{item.sku}</td>
                  <td>{item.colorName}</td>
                  <td>{item.size}</td>
                  <td>{item.quantity}</td>
                  <td className="admin-order-item-note">{item.productionNote || "Sin nota"}</td>
                  <td>{formatMoney(item.unitPrice)}</td>
                  <td>{formatMoney(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-customer-detail__panel">
        <div className="admin-customer-section-heading">
          <div>
            <span className="eyebrow">Pago</span>
            <h2>Resumen económico</h2>
          </div>
          <span className={`admin-page__status ${getStatusClass(order.paymentStatus)}`}>
            {paymentStatusLabels[order.paymentStatus] || "Sin estado"}
          </span>
        </div>

        <div className="admin-customer-billing">
          <div>
            <span>Subtotal</span>
            <small>{formatMoney(order.subtotal)}</small>
          </div>
          <div>
            <span>Envío</span>
            <small>{formatMoney(order.shippingCost)}</small>
          </div>
          <div>
            <span>Descuento</span>
            <small>{formatMoney(order.discount)}</small>
          </div>
          <div>
            <span>IVA</span>
            <small>{order.taxEnabled ? `${formatMoney(order.taxAmount)} (${order.taxRate}%)` : "No aplica"}</small>
          </div>
          <div>
            <span>Total</span>
            <small>{formatMoney(order.total)}</small>
          </div>
          <div>
            <span>Método</span>
            <small>{order.paymentMethod}</small>
          </div>
          {order.paymentStatus === "partial" ? (
            <>
              <div>
                <span>Abono</span>
                <small>{formatMoney(order.paymentDepositAmount)}</small>
              </div>
              <div>
                <span>Saldo</span>
                <small>{formatMoney(Math.max(order.total - order.paymentDepositAmount, 0))}</small>
              </div>
            </>
          ) : null}
          <div>
            <span>Factura</span>
            <small>{order.invoiceRequired ? "Requerida" : "No requerida"}</small>
          </div>
        </div>
      </section>

      <section className="admin-customer-detail__panel">
        <div className="admin-customer-section-heading">
          <div>
            <span className="eyebrow">Envío</span>
            <h2>Destino y tracking</h2>
          </div>
          <span className={`admin-page__status ${getStatusClass(order.orderStatus)}`}>
            {orderStatusLabels[order.orderStatus] || "Sin estado"}
          </span>
        </div>

        <div className="admin-customer-address-grid">
          <article className="admin-customer-address">
            <MapPin size={18} strokeWidth={1.8} aria-hidden="true" />
            <div>
              <span>
                {order.deliveryMethod === "pickup" ? "Retiro en local" : `${order.shippingAddress.city}, ${order.shippingAddress.province}`}
              </span>
              {order.deliveryMethod !== "pickup" ? <small>{order.shippingAddress.country}</small> : null}
              {order.deliveryMethod !== "pickup" && order.shippingAddress.postalCode ? <small>CP {order.shippingAddress.postalCode}</small> : null}
              <small>{order.deliveryMethod === "pickup" ? "El cliente retirará el pedido en tienda." : order.shippingAddress.addressLine}</small>
              {order.deliveryMethod !== "pickup" && order.shippingAddress.reference ? <small>{order.shippingAddress.reference}</small> : null}
              {order.deliveryMethod !== "pickup" && order.shippingRecipient.enabled ? (
                <small>Recibe: {order.shippingRecipient.fullName} / {order.shippingRecipient.documentNumber}</small>
              ) : null}
            </div>
          </article>
          <article className="admin-customer-address">
            <Truck size={18} strokeWidth={1.8} aria-hidden="true" />
            <div>
              <span>{order.shipment.courier || "Courier sin asignar"}</span>
              <small>{order.shipment.trackingNumber || "Sin número de guía"}</small>
              {order.shipment.trackingUrl ? <small>{order.shipment.trackingUrl}</small> : null}
            </div>
          </article>
        </div>
      </section>

      {order.notes ? (
        <section className="admin-customer-detail__panel">
          <div className="admin-customer-section-heading">
            <div>
              <span className="eyebrow">Notas</span>
              <h2>Notas internas</h2>
            </div>
          </div>
          <p className="admin-page__section-summary">{order.notes}</p>
        </section>
      ) : null}
    </div>
  );
}

import { ArrowLeft, Mail, PackageCheck, Phone, ReceiptText, Wallet } from "lucide-react";
import { isValidObjectId } from "mongoose";
import Link from "next/link";
import { notFound } from "next/navigation";

import { connectDB } from "@/lib/db";
import Sale from "@/models/Sale";
import { updateSaleInvoiceStatus } from "../actions";

export const metadata = {
  title: "Detalle de venta | Admin Kowac",
};

const paymentMethodLabels = {
  card: "Tarjeta",
  cash: "Efectivo",
  mixed: "Mixto",
  transfer: "Transferencia",
};

const invoiceStatusLabels = {
  cancelled: "Cancelada",
  issued: "Emitida",
  not_required: "Sin factura",
  pending: "Pendiente",
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
  if (["completed", "issued"].includes(status)) {
    return "admin-page__status--success";
  }

  if (["voided", "cancelled"].includes(status)) {
    return "admin-page__status--danger";
  }

  if (status === "pending") {
    return "admin-page__status--warning";
  }

  return "admin-page__status--muted";
}

async function getSale(saleId) {
  if (!isValidObjectId(saleId)) {
    notFound();
  }

  await connectDB();

  const sale = await Sale.findById(saleId).lean();

  if (!sale) {
    notFound();
  }

  return {
    createdAt: sale.createdAt,
    customer: {
      documentNumber: sale.customer?.documentNumber || "",
      email: sale.customer?.email || "",
      fullName: `${sale.customer?.firstName || ""} ${sale.customer?.lastName || ""}`.trim() || "Consumidor final",
      phone: sale.customer?.phone || "",
      taxName: sale.customer?.taxName || "",
    },
    customerMode: sale.customerMode,
    discountTotal: sale.discountTotal || 0,
    id: sale._id.toString(),
    invoiceRequired: Boolean(sale.invoiceRequired),
    invoiceStatus: sale.invoiceStatus,
    items: (sale.items || []).map((item, index) => ({
      colorName: item.colorName || "",
      discountAmount: item.discountAmount || 0,
      id: `${item.sku}-${index}`,
      productName: item.productName,
      quantity: item.quantity || 0,
      size: item.size || "",
      sku: item.sku,
      total: item.total || 0,
      unitPrice: item.unitPrice || 0,
    })),
    notes: sale.notes || "",
    paymentMethod: sale.paymentMethod,
    saleNumber: sale.saleNumber,
    subtotal: sale.subtotal || 0,
    taxAmount: sale.taxAmount || 0,
    taxEnabled: Boolean(sale.taxEnabled),
    taxRate: sale.taxRate || 0,
    total: sale.total || 0,
    updatedAt: sale.updatedAt,
  };
}

export default async function AdminSaleDetailPage({ params }) {
  const { saleId } = await params;
  const sale = await getSale(saleId);
  const itemsCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="admin-page">
      <Link href="/admin/ventas" className="admin-page__action-pill admin-page__back-link">
        <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
        Volver a ventas
      </Link>

      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Venta</span>
          <h1>{sale.saleNumber}</h1>
          <p className="text-muted">
            Revisa productos, descuentos, IVA opcional, pago y estado de factura de la venta directa.
          </p>
          <span className="admin-sale-detail-date">Fecha {formatDate(sale.createdAt)}</span>
        </div>
      </div>

      <section className="admin-customer-purchase-stats admin-sale-detail-summary" aria-label="Resumen de la venta">
        <article className="admin-customer-purchase-stat admin-customer-purchase-stat--primary">
          <Wallet size={21} strokeWidth={1.8} aria-hidden="true" />
          <div>
            <span>Total</span>
            <strong>{formatMoney(sale.total)}</strong>
            <small>{paymentMethodLabels[sale.paymentMethod] || sale.paymentMethod}</small>
          </div>
        </article>
        <article className="admin-customer-purchase-stat">
          <PackageCheck size={21} strokeWidth={1.8} aria-hidden="true" />
          <div>
            <span>Productos</span>
            <strong>{itemsCount}</strong>
            <small>{sale.items.length} línea(s)</small>
          </div>
        </article>
      </section>

      <section className="admin-customer-detail__panel">
        <div className="admin-customer-section-heading">
          <div>
            <span className="eyebrow">Cliente</span>
            <h2>Información de venta</h2>
          </div>
        </div>

        <div className="admin-customer-contact-grid">
          <span>
            <Mail size={16} strokeWidth={1.8} aria-hidden="true" />
            <span>Correo</span>
            <small>{sale.customer.email || "No registrado"}</small>
          </span>
          <span>
            <Phone size={16} strokeWidth={1.8} aria-hidden="true" />
            <span>Teléfono</span>
            <small>{sale.customer.phone || "No registrado"}</small>
          </span>
          <span>
            <ReceiptText size={16} strokeWidth={1.8} aria-hidden="true" />
            <span>Cliente</span>
            <small>{sale.customer.fullName}</small>
          </span>
          <span>
            <PackageCheck size={16} strokeWidth={1.8} aria-hidden="true" />
            <span>Factura</span>
            <small>{invoiceStatusLabels[sale.invoiceStatus] || "Sin estado"}</small>
          </span>
        </div>
      </section>

      <section className="admin-customer-detail__panel">
        <div className="admin-customer-section-heading">
          <div>
            <span className="eyebrow">Productos</span>
            <h2>Artículos vendidos</h2>
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
                <th>Precio</th>
                <th>Descuento</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => (
                <tr key={item.id}>
                  <td className="admin-page__primary-cell">
                    <strong>{item.productName}</strong>
                    <span>{item.sku}</span>
                  </td>
                  <td>{item.sku}</td>
                  <td>{item.colorName || "N/A"}</td>
                  <td>{item.size || "N/A"}</td>
                  <td>{item.quantity}</td>
                  <td>{formatMoney(item.unitPrice)}</td>
                  <td>{formatMoney(item.discountAmount)}</td>
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
            <span className="eyebrow">Totales</span>
            <h2>Resumen económico</h2>
          </div>
        </div>

        <div className="admin-sale-economic-summary">
          <div className="admin-sale-economic-summary__list">
            <div>
              <span>Subtotal</span>
              <small>{formatMoney(sale.subtotal)}</small>
            </div>
            <div>
              <span>Descuento</span>
              <small>- {formatMoney(sale.discountTotal)}</small>
            </div>
            <div>
              <span>IVA</span>
              <small>+ {sale.taxEnabled ? formatMoney(sale.taxAmount) : formatMoney(0)}</small>
            </div>
            <div className="admin-sale-economic-summary__total">
              <span>Total</span>
              <small>{formatMoney(sale.total)}</small>
            </div>
          </div>

          <div className="admin-sale-economic-summary__meta">
            <div>
              <span>Método de pago</span>
              <small>{paymentMethodLabels[sale.paymentMethod] || sale.paymentMethod}</small>
            </div>
            <div>
              <span>Factura</span>
              <small>{sale.invoiceRequired ? invoiceStatusLabels[sale.invoiceStatus] : "No requerida"}</small>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-customer-detail__panel">
        <div className="admin-customer-section-heading">
          <div>
            <span className="eyebrow">Factura</span>
            <h2>Estado de facturación</h2>
          </div>
        </div>

        <form action={updateSaleInvoiceStatus} className="admin-sale-invoice-form">
          <input type="hidden" name="saleId" value={sale.id} />
          <label>
            <span>Estado</span>
            <select name="invoiceStatus" defaultValue={sale.invoiceStatus}>
              <option value="not_required">Sin factura</option>
              <option value="pending">Pendiente</option>
              <option value="issued">Emitida</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </label>
          <button type="submit" className="admin-button admin-button--primary admin-button--lg">
            Guardar factura
          </button>
        </form>
      </section>

      {sale.notes ? (
        <section className="admin-customer-detail__panel">
          <div className="admin-customer-section-heading">
            <div>
              <span className="eyebrow">Notas</span>
              <h2>Notas internas</h2>
            </div>
          </div>
          <p className="admin-page__section-summary">{sale.notes}</p>
        </section>
      ) : null}
    </div>
  );
}

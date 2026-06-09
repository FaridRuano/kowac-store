import { Eye, Plus, ReceiptText, Wallet } from "lucide-react";
import Link from "next/link";

import SaleLiveFilters from "@/components/admin/SaleLiveFilters";
import { connectDB } from "@/lib/db";
import Sale from "@/models/Sale";

export const metadata = {
  title: "Ventas | Admin Kowac",
};

const SALES_PER_PAGE = 10;

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

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeSearchParams(searchParams = {}) {
  const rawPage = Number.parseInt(Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page, 10);
  const paymentMethod = String(Array.isArray(searchParams.pago) ? searchParams.pago[0] : searchParams.pago || "").trim();
  const invoiceStatus = String(Array.isArray(searchParams.factura) ? searchParams.factura[0] : searchParams.factura || "").trim();

  return {
    invoiceStatus: invoiceStatusLabels[invoiceStatus] ? invoiceStatus : "",
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
    paymentMethod: paymentMethodLabels[paymentMethod] ? paymentMethod : "",
    q: String(Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q || "").trim(),
  };
}

function buildSaleFilters({ invoiceStatus, paymentMethod, q }) {
  const filters = {};

  if (paymentMethod) {
    filters.paymentMethod = paymentMethod;
  }

  if (invoiceStatus) {
    filters.invoiceStatus = invoiceStatus;
  }

  if (q) {
    const searchRegex = new RegExp(escapeRegex(q), "i");

    filters.$or = [
      { saleNumber: searchRegex },
      { "customer.firstName": searchRegex },
      { "customer.lastName": searchRegex },
      { "customer.email": searchRegex },
      { "customer.phone": searchRegex },
      { "customer.documentNumber": searchRegex },
    ];
  }

  return filters;
}

function formatDate(value) {
  if (!value) {
    return "S/F";
  }

  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "2-digit",
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

function buildPageHref(page, params) {
  const query = new URLSearchParams();

  if (params.q) {
    query.set("q", params.q);
  }

  if (params.paymentMethod) {
    query.set("pago", params.paymentMethod);
  }

  if (params.invoiceStatus) {
    query.set("factura", params.invoiceStatus);
  }

  if (page > 1) {
    query.set("page", String(page));
  }

  const queryString = query.toString();
  return `/admin/ventas${queryString ? `?${queryString}` : ""}`;
}

async function getSalesOverview(params) {
  await connectDB();

  const filters = buildSaleFilters(params);
  const [totalSales, completedSummary, totalFilteredSales] = await Promise.all([
    Sale.countDocuments({}),
    Sale.aggregate([
      { $match: { saleStatus: "completed" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Sale.countDocuments(filters),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalFilteredSales / SALES_PER_PAGE));
  const currentPage = Math.min(params.page, totalPages);
  const sales = await Sale.find(filters)
    .select("saleNumber customer total invoiceStatus createdAt")
    .sort({ createdAt: -1 })
    .skip((currentPage - 1) * SALES_PER_PAGE)
    .limit(SALES_PER_PAGE)
    .lean();
  const completedTotals = completedSummary[0] || { total: 0 };

  return {
    currentPage,
    metrics: [
      {
        helper: "Ventas registradas",
        icon: ReceiptText,
        label: "Ventas",
        value: totalSales,
      },
      {
        helper: "Ventas completadas",
        icon: Wallet,
        label: "Total vendido",
        value: formatMoney(completedTotals.total),
      },
    ],
    sales: sales.map((sale) => ({
      createdAt: sale.createdAt,
      customerEmail: sale.customer?.email || "",
      customerName: `${sale.customer?.firstName || ""} ${sale.customer?.lastName || ""}`.trim() || "Consumidor final",
      id: sale._id.toString(),
      invoiceStatus: sale.invoiceStatus,
      saleNumber: sale.saleNumber,
      total: sale.total || 0,
    })),
    totalFilteredSales,
    totalPages,
  };
}

export default async function AdminSalesPage({ searchParams }) {
  const params = normalizeSearchParams(await searchParams);
  const overview = await getSalesOverview(params);

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Ventas</span>
          <h1>Ventas directas</h1>
          <p className="text-muted">
            Registra y revisa ventas manuales del local físico, consumidor final, descuentos, IVA opcional y facturación.
          </p>
        </div>
        <Link href="/admin/ventas/nueva" className="admin-page__action-pill">
          <Plus size={15} strokeWidth={1.8} aria-hidden="true" />
          Nueva venta
        </Link>
      </div>

      <section className="admin-order-metrics" aria-label="Resumen de ventas">
        {overview.metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <article key={metric.label} className="admin-order-metric">
              <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
              <div>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.helper}</small>
              </div>
            </article>
          );
        })}
      </section>

      <SaleLiveFilters
        currentInvoiceStatus={params.invoiceStatus}
        currentPaymentMethod={params.paymentMethod}
        currentQuery={params.q}
        invoiceStatusLabels={invoiceStatusLabels}
        paymentMethodLabels={paymentMethodLabels}
      />

      {overview.sales.length ? (
        <>
          <div className="admin-page__table-wrap">
            <table className="admin-page__table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Factura</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {overview.sales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="admin-sale-id-cell">
                      <span>{sale.saleNumber}</span>
                    </td>
                    <td className="admin-sale-customer-cell">
                      <div className="admin-page__primary-cell">
                        <strong>{sale.customerName}</strong>
                        {sale.customerEmail ? <span>{sale.customerEmail}</span> : null}
                      </div>
                    </td>
                    <td>{formatDate(sale.createdAt)}</td>
                    <td>{formatMoney(sale.total)}</td>
                    <td>
                      <span className={`admin-page__status ${getStatusClass(sale.invoiceStatus)}`}>
                        {invoiceStatusLabels[sale.invoiceStatus] || "Sin estado"}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/admin/ventas/${sale.id}`}
                        className="admin-icon-button admin-icon-button--secondary admin-table-icon-link"
                        aria-label={`Ver detalle de la venta ${sale.saleNumber}`}
                        title="Ver detalle"
                      >
                        <Eye size={16} strokeWidth={1.8} aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-customer-pagination">
            <Link
              href={buildPageHref(Math.max(1, overview.currentPage - 1), params)}
              aria-disabled={overview.currentPage === 1}
              className={overview.currentPage === 1 ? "is-disabled" : ""}
            >
              Anterior
            </Link>
            <span>
              Página {overview.currentPage} de {overview.totalPages}
            </span>
            <Link
              href={buildPageHref(Math.min(overview.totalPages, overview.currentPage + 1), params)}
              aria-disabled={overview.currentPage === overview.totalPages}
              className={overview.currentPage === overview.totalPages ? "is-disabled" : ""}
            >
              Siguiente
            </Link>
          </div>
        </>
      ) : (
        <div className="admin-customer-orders-empty">
          <span>Sin ventas en esta vista</span>
          <small>Las ventas aparecerán aquí cuando se registren desde caja.</small>
        </div>
      )}
    </div>
  );
}

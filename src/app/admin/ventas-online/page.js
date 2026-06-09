import { Eye, PackageCheck, ReceiptText, Wallet } from "lucide-react";
import Link from "next/link";

import OnlineSaleLiveFilters from "@/components/admin/OnlineSaleLiveFilters";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";

export const metadata = {
  title: "Ventas online | Admin Kowac",
};

const ONLINE_SALES_PER_PAGE = 10;

const orderStatusLabels = {
  cancelled: "Cancelada",
  confirmed: "Confirmada",
  delivered: "Entregada",
  pending: "Pendiente",
  preparing: "Preparando",
  shipped: "Enviada",
};

const paymentStatusLabels = {
  failed: "Fallido",
  paid: "Pagado",
  partial: "Abonado",
  pending: "Pendiente",
  refunded: "Reembolsado",
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeSearchParams(searchParams = {}) {
  const rawPage = Number.parseInt(Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page, 10);
  const orderStatus = String(Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status || "").trim();
  const paymentStatus = String(Array.isArray(searchParams.pago) ? searchParams.pago[0] : searchParams.pago || "").trim();

  return {
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
    paymentStatus: paymentStatusLabels[paymentStatus] ? paymentStatus : "",
    q: String(Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q || "").trim(),
    status: orderStatusLabels[orderStatus] ? orderStatus : "",
  };
}

function buildOnlineSaleFilters({ paymentStatus, q, status }) {
  const filters = {
    orderType: "online_sale",
  };

  if (status) {
    filters.orderStatus = status;
  }

  if (paymentStatus) {
    filters.paymentStatus = paymentStatus;
  }

  if (q) {
    const searchRegex = new RegExp(escapeRegex(q), "i");

    filters.$or = [
      { orderNumber: searchRegex },
      { "customer.firstName": searchRegex },
      { "customer.lastName": searchRegex },
      { "customer.email": searchRegex },
      { "customer.phone": searchRegex },
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

function buildPageHref(page, params) {
  const query = new URLSearchParams();

  if (params.q) {
    query.set("q", params.q);
  }

  if (params.status) {
    query.set("status", params.status);
  }

  if (params.paymentStatus) {
    query.set("pago", params.paymentStatus);
  }

  if (page > 1) {
    query.set("page", String(page));
  }

  const queryString = query.toString();
  return `/admin/ventas-online${queryString ? `?${queryString}` : ""}`;
}

async function getOnlineSalesOverview(params) {
  await connectDB();

  const filters = buildOnlineSaleFilters(params);
  const baseFilters = { orderType: "online_sale" };
  const [totalSales, completedSales, totalSummary, totalFilteredSales] = await Promise.all([
    Order.countDocuments(baseFilters),
    Order.countDocuments({ ...baseFilters, orderStatus: "delivered" }),
    Order.aggregate([
      { $match: baseFilters },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.countDocuments(filters),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalFilteredSales / ONLINE_SALES_PER_PAGE));
  const currentPage = Math.min(params.page, totalPages);
  const sales = await Order.find(filters)
    .select("orderNumber customer total paymentStatus orderStatus paymentMethod createdAt items shippingAddress deliveryMethod")
    .sort({ createdAt: -1 })
    .skip((currentPage - 1) * ONLINE_SALES_PER_PAGE)
    .limit(ONLINE_SALES_PER_PAGE)
    .lean();

  return {
    currentPage,
    metrics: [
      {
        helper: "Compras desde la web",
        icon: ReceiptText,
        label: "Todas las ventas",
        value: totalSales,
      },
      {
        helper: "Entregadas al cliente",
        icon: PackageCheck,
        label: "Ventas completadas",
        value: completedSales,
      },
      {
        helper: "Total registrado",
        icon: Wallet,
        label: "Total en dinero",
        value: formatMoney(totalSummary[0]?.total || 0),
      },
    ],
    sales: sales.map((sale) => ({
      createdAt: sale.createdAt,
      customerEmail: sale.customer?.email || "",
      customerName: `${sale.customer?.firstName || ""} ${sale.customer?.lastName || ""}`.trim(),
      deliveryMethod: sale.deliveryMethod || "shipping",
      id: sale._id.toString(),
      itemsCount: sale.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
      orderNumber: sale.orderNumber,
      orderStatus: sale.orderStatus,
      paymentMethod: sale.paymentMethod,
      paymentStatus: sale.paymentStatus,
      shippingCity: sale.shippingAddress?.city || "",
      total: sale.total,
    })),
    totalFilteredSales,
    totalPages,
  };
}

export default async function AdminOnlineSalesPage({ searchParams }) {
  const params = normalizeSearchParams(await searchParams);
  const overview = await getOnlineSalesOverview(params);

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Ventas online</span>
          <h1>Ventas online</h1>
          <p className="text-muted">
            Gestiona compras realizadas en la web, pagos, preparación, envío y entrega.
          </p>
        </div>
      </div>

      <section className="admin-order-metrics" aria-label="Resumen de ventas online">
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

      <OnlineSaleLiveFilters
        currentPaymentStatus={params.paymentStatus}
        currentQuery={params.q}
        currentStatus={params.status}
        paymentStatusLabels={paymentStatusLabels}
        statusLabels={orderStatusLabels}
      />

      {overview.sales.length ? (
        <>
          <div className="admin-page__table-wrap">
            <table className="admin-page__table">
              <thead>
                <tr>
                  <th>Venta</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Artículos</th>
                  <th>Total</th>
                  <th>Pago</th>
                  <th>Estado</th>
                  <th>Entrega</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {overview.sales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="admin-page__primary-cell">
                      <strong>{sale.orderNumber}</strong>
                      <span>{sale.paymentMethod}</span>
                    </td>
                    <td className="admin-page__primary-cell">
                      <strong>{sale.customerName || "Cliente sin nombre"}</strong>
                      <span>{sale.customerEmail}</span>
                    </td>
                    <td>{formatDate(sale.createdAt)}</td>
                    <td>{sale.itemsCount}</td>
                    <td>{formatMoney(sale.total)}</td>
                    <td>
                      <span className={`admin-page__status ${getStatusClass(sale.paymentStatus)}`}>
                        {paymentStatusLabels[sale.paymentStatus] || "Sin estado"}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-page__status ${getStatusClass(sale.orderStatus)}`}>
                        {orderStatusLabels[sale.orderStatus] || "Sin estado"}
                      </span>
                    </td>
                    <td>{sale.deliveryMethod === "pickup" ? "Retiro en local" : sale.shippingCity || "Sin ciudad"}</td>
                    <td>
                      <Link
                        href={`/admin/ventas-online/${sale.id}`}
                        className="admin-icon-button admin-icon-button--secondary admin-table-icon-link"
                        aria-label={`Ver detalle de la venta online ${sale.orderNumber}`}
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
          <span>Sin ventas online en esta vista</span>
          <small>Cuando el checkout registre compras web, aparecerán aquí para gestionar pago, preparación y envío.</small>
        </div>
      )}
    </div>
  );
}

import { Clock3, Eye, PackageCheck, Plus, ReceiptText } from "lucide-react";
import Link from "next/link";

import OrderLiveFilters from "@/components/admin/OrderLiveFilters";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";

export const metadata = {
  title: "Pedidos | Admin Kowac",
};

const ORDERS_PER_PAGE = 10;

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

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeSearchParams(searchParams = {}) {
  const rawPage = Number.parseInt(Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page, 10);
  const orderStatus = String(Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status || "").trim();

  return {
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
    q: String(Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q || "").trim(),
    status: orderStatusLabels[orderStatus] ? orderStatus : "",
  };
}

function buildOrderFilters({ q, status }) {
  const filters = {
    $or: [
      { orderType: "production_order" },
      { orderType: { $exists: false } },
      { orderType: "" },
    ],
  };

  if (status) {
    filters.orderStatus = status;
  }

  if (q) {
    const searchRegex = new RegExp(escapeRegex(q), "i");

    filters.$and = [
      { $or: filters.$or },
      {
        $or: [
          { "customer.firstName": searchRegex },
          { "customer.lastName": searchRegex },
          { "customer.email": searchRegex },
          { "customer.phone": searchRegex },
        ],
      },
    ];
    delete filters.$or;
  }

  return filters;
}

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

function buildPageHref(page, params) {
  const query = new URLSearchParams();

  if (params.q) {
    query.set("q", params.q);
  }

  if (params.status) {
    query.set("status", params.status);
  }

  if (page > 1) {
    query.set("page", String(page));
  }

  const queryString = query.toString();
  return `/admin/pedidos${queryString ? `?${queryString}` : ""}`;
}

async function getOrdersOverview(params) {
  await connectDB();

  const filters = buildOrderFilters(params);
  const productionFilters = {
    $or: [
      { orderType: "production_order" },
      { orderType: { $exists: false } },
      { orderType: "" },
    ],
  };
  const [totalOrders, completedOrders, processOrders, totalFilteredOrders] = await Promise.all([
    Order.countDocuments(productionFilters),
    Order.countDocuments({ ...productionFilters, orderStatus: "delivered" }),
    Order.countDocuments({ ...productionFilters, orderStatus: { $in: ["pending", "confirmed", "preparing", "shipped"] } }),
    Order.countDocuments(filters),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalFilteredOrders / ORDERS_PER_PAGE));
  const currentPage = Math.min(params.page, totalPages);
  const orders = await Order.find(filters)
    .select("orderNumber customer total paymentStatus orderStatus paymentMethod createdAt items shippingAddress deliveryMethod")
    .sort({ createdAt: -1 })
    .skip((currentPage - 1) * ORDERS_PER_PAGE)
    .limit(ORDERS_PER_PAGE)
    .lean();

  return {
    currentPage,
    metrics: [
      {
        helper: "Total registrado",
        icon: ReceiptText,
        label: "Cantidad de pedidos",
        value: totalOrders,
      },
      {
        helper: "Entregados al cliente",
        icon: PackageCheck,
        label: "Pedidos completos",
        value: completedOrders,
      },
      {
        helper: "Pendientes, confirmados, preparando o enviados",
        icon: Clock3,
        label: "Pedidos en proceso",
        value: processOrders,
      },
    ],
    orders: orders.map((order) => ({
      createdAt: order.createdAt,
      customerEmail: order.customer?.email || "",
      customerName: `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim(),
      id: order._id.toString(),
      itemsCount: order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      deliveryMethod: order.deliveryMethod || "shipping",
      shippingCity: order.shippingAddress?.city || "",
      total: order.total,
    })),
    totalFilteredOrders,
    totalPages,
  };
}

export default async function AdminOrdersPage({ searchParams }) {
  const params = normalizeSearchParams(await searchParams);
  const overview = await getOrdersOverview(params);

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Producción</span>
          <h1>Pedidos a fábrica</h1>
          <p className="text-muted">
            Controla pedidos manuales de producción, pagos, fabricación y entrega al cliente.
          </p>
        </div>
        <Link href="/admin/pedidos/nuevo" className="admin-page__action-pill">
          <Plus size={15} strokeWidth={1.8} aria-hidden="true" />
          Nuevo pedido
        </Link>
      </div>

      <section className="admin-order-metrics" aria-label="Resumen de pedidos">
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

      <OrderLiveFilters currentQuery={params.q} currentStatus={params.status} statusLabels={orderStatusLabels} />

      {overview.orders.length ? (
        <>
          <div className="admin-page__table-wrap">
            <table className="admin-page__table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Artículos</th>
                  <th>Total</th>
                  <th>Pago</th>
                  <th>Estado</th>
                  <th>Destino</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {overview.orders.map((order) => (
                  <tr key={order.id}>
                    <td className="admin-page__primary-cell">
                      <strong>{order.orderNumber}</strong>
                      <span>{order.paymentMethod}</span>
                    </td>
                    <td className="admin-page__primary-cell">
                      <strong>{order.customerName || "Cliente sin nombre"}</strong>
                      <span>{order.customerEmail}</span>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>{order.itemsCount}</td>
                    <td>{formatMoney(order.total)}</td>
                    <td>
                      <span className={`admin-page__status ${getStatusClass(order.paymentStatus)}`}>
                        {paymentStatusLabels[order.paymentStatus] || "Sin estado"}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-page__status ${getStatusClass(order.orderStatus)}`}>
                        {orderStatusLabels[order.orderStatus] || "Sin estado"}
                      </span>
                    </td>
                    <td>{order.deliveryMethod === "pickup" ? "Retiro en local" : order.shippingCity || "Sin ciudad"}</td>
                    <td>
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="admin-icon-button admin-icon-button--secondary admin-table-icon-link"
                        aria-label={`Ver detalle del pedido ${order.orderNumber}`}
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
          <span>Sin pedidos en esta vista</span>
          <small>Cuando se registren pedidos de producción para fábrica, aparecerán aquí.</small>
        </div>
      )}
    </div>
  );
}

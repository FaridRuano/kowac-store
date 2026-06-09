import { Boxes, Clock3, DollarSign, Factory, ReceiptText, ShoppingBag, UsersRound } from "lucide-react";

import SummaryLiveFilters from "@/components/admin/SummaryLiveFilters";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";
import Order from "@/models/Order";
import Sale from "@/models/Sale";

export const metadata = {
  title: "Resumen comercial | Admin Kowac",
};

const flowLabels = {
  all: "Todos los flujos",
  direct: "Ventas directas",
  online: "Ventas online",
  production: "Pedidos a fábrica",
};

function normalizeSearchParams(searchParams = {}) {
  const flow = String(Array.isArray(searchParams.flujo) ? searchParams.flujo[0] : searchParams.flujo || "all").trim();

  return {
    endDate: normalizeDateInput(Array.isArray(searchParams.hasta) ? searchParams.hasta[0] : searchParams.hasta),
    flow: flowLabels[flow] ? flow : "all",
    month: normalizeMonthInput(Array.isArray(searchParams.mes) ? searchParams.mes[0] : searchParams.mes),
    startDate: normalizeDateInput(Array.isArray(searchParams.desde) ? searchParams.desde[0] : searchParams.desde),
  };
}

function normalizeDateInput(value) {
  const rawValue = String(value || "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return "";
  }

  const date = new Date(`${rawValue}T00:00:00`);

  return Number.isNaN(date.getTime()) ? "" : rawValue;
}

function normalizeMonthInput(value) {
  const rawValue = String(value || "").trim();

  if (!/^\d{4}-\d{2}$/.test(rawValue)) {
    return "";
  }

  const date = new Date(`${rawValue}-01T00:00:00`);

  return Number.isNaN(date.getTime()) ? "" : rawValue;
}

function buildDateFilter(params) {
  const createdAt = {};

  if (params.startDate) {
    createdAt.$gte = new Date(`${params.startDate}T00:00:00`);
  }

  if (params.endDate) {
    createdAt.$lte = new Date(`${params.endDate}T23:59:59.999`);
  }

  if (!params.startDate && !params.endDate && params.month) {
    const monthStart = new Date(`${params.month}-01T00:00:00`);
    const monthEnd = new Date(monthStart);

    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setMilliseconds(monthEnd.getMilliseconds() - 1);
    createdAt.$gte = monthStart;
    createdAt.$lte = monthEnd;
  }

  return Object.keys(createdAt).length ? { createdAt } : {};
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-EC", {
    currency: "USD",
    style: "currency",
  }).format(value || 0);
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

function includesFlow(params, flow) {
  return params.flow === "all" || params.flow === flow;
}

function getOrderTypeFilter(type) {
  if (type === "production_order") {
    return {
      $or: [
        { orderType: "production_order" },
        { orderType: { $exists: false } },
        { orderType: "" },
      ],
    };
  }

  return { orderType: type };
}

async function getSaleSummary(match) {
  const [summary] = await Sale.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        discount: { $sum: "$discountTotal" },
        items: { $sum: { $sum: "$items.quantity" } },
        tax: { $sum: "$taxAmount" },
        total: { $sum: "$total" },
      },
    },
  ]);

  return {
    count: summary?.count || 0,
    discount: summary?.discount || 0,
    items: summary?.items || 0,
    pending: await Sale.countDocuments({ ...match, invoiceStatus: "pending" }),
    tax: summary?.tax || 0,
    total: summary?.total || 0,
  };
}

async function getOrderSummary(match) {
  const [summary] = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        discount: { $sum: "$discount" },
        items: { $sum: { $sum: "$items.quantity" } },
        shipping: { $sum: "$shippingCost" },
        tax: { $sum: "$taxAmount" },
        total: { $sum: "$total" },
      },
    },
  ]);

  return {
    count: summary?.count || 0,
    discount: summary?.discount || 0,
    items: summary?.items || 0,
    pending: await Order.countDocuments({ ...match, orderStatus: { $in: ["pending", "confirmed", "preparing"] } }),
    shipping: summary?.shipping || 0,
    tax: summary?.tax || 0,
    total: summary?.total || 0,
  };
}

async function getTopProducts({ dateFilter, includeDirect, includeOnline, includeProduction }) {
  const groups = [];

  if (includeDirect) {
    groups.push(...await Sale.aggregate([
      { $match: { saleStatus: "completed", ...dateFilter } },
      { $unwind: "$items" },
      {
        $group: {
          _id: { name: "$items.productName", sku: "$items.sku" },
          quantity: { $sum: "$items.quantity" },
          total: { $sum: "$items.total" },
        },
      },
    ]));
  }

  const orderTypes = [];

  if (includeOnline) {
    orderTypes.push("online_sale");
  }

  if (includeProduction) {
    orderTypes.push("production_order");
  }

  if (orderTypes.length) {
    const typeMatch = orderTypes.length === 2
      ? {
          $or: [
            { orderType: "online_sale" },
            { orderType: "production_order" },
            { orderType: { $exists: false } },
            { orderType: "" },
          ],
        }
      : getOrderTypeFilter(orderTypes[0]);

    groups.push(...await Order.aggregate([
      { $match: { ...typeMatch, ...dateFilter } },
      { $unwind: "$items" },
      {
        $group: {
          _id: { name: "$items.productName", sku: "$items.sku" },
          quantity: { $sum: "$items.quantity" },
          total: { $sum: "$items.total" },
        },
      },
    ]));
  }

  const productsByKey = new Map();

  for (const group of groups) {
    const key = `${group._id?.name || "Producto"}-${group._id?.sku || ""}`;
    const current = productsByKey.get(key) || {
      name: group._id?.name || "Producto",
      quantity: 0,
      sku: group._id?.sku || "",
      total: 0,
    };

    current.quantity += group.quantity || 0;
    current.total += group.total || 0;
    productsByKey.set(key, current);
  }

  return Array.from(productsByKey.values())
    .sort((first, second) => second.quantity - first.quantity)
    .slice(0, 6);
}

async function getRecentActivity({ dateFilter, includeDirect, includeOnline, includeProduction }) {
  const activity = [];

  if (includeDirect) {
    const sales = await Sale.find({ ...dateFilter })
      .select("saleNumber customer total invoiceStatus createdAt")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    activity.push(...sales.map((sale) => ({
      amount: sale.total || 0,
      customer: `${sale.customer?.firstName || ""} ${sale.customer?.lastName || ""}`.trim() || "Consumidor final",
      date: sale.createdAt,
      label: sale.saleNumber,
      status: sale.invoiceStatus || "Sin factura",
      type: "Venta directa",
    })));
  }

  const orderMatches = [];

  if (includeOnline) {
    orderMatches.push(getOrderTypeFilter("online_sale"));
  }

  if (includeProduction) {
    orderMatches.push(getOrderTypeFilter("production_order"));
  }

  if (orderMatches.length) {
    const typeFilter = orderMatches.length === 1 ? orderMatches[0] : { $or: orderMatches.flatMap((match) => match.$or || [match]) };
    const orders = await Order.find({ ...typeFilter, ...dateFilter })
      .select("orderNumber orderType customer total orderStatus createdAt")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    activity.push(...orders.map((order) => ({
      amount: order.total || 0,
      customer: `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim() || "Cliente sin nombre",
      date: order.createdAt,
      label: order.orderNumber,
      status: order.orderStatus || "Sin estado",
      type: order.orderType === "online_sale" ? "Venta online" : "Pedido a fábrica",
    })));
  }

  return activity
    .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime())
    .slice(0, 8);
}

async function getCommercialSummary(params) {
  await connectDB();

  const dateFilter = buildDateFilter(params);
  const includeDirect = includesFlow(params, "direct");
  const includeOnline = includesFlow(params, "online");
  const includeProduction = includesFlow(params, "production");
  const directSummary = includeDirect ? await getSaleSummary({ saleStatus: "completed", ...dateFilter }) : null;
  const onlineSummary = includeOnline ? await getOrderSummary({ ...getOrderTypeFilter("online_sale"), ...dateFilter }) : null;
  const productionSummary = includeProduction ? await getOrderSummary({ ...getOrderTypeFilter("production_order"), ...dateFilter }) : null;
  const [customersCount, activeCustomersCount, topProducts, recentActivity] = await Promise.all([
    Customer.countDocuments(dateFilter),
    Customer.countDocuments({ isActive: { $ne: false } }),
    getTopProducts({ dateFilter, includeDirect, includeOnline, includeProduction }),
    getRecentActivity({ dateFilter, includeDirect, includeOnline, includeProduction }),
  ]);
  const summaries = [directSummary, onlineSummary, productionSummary].filter(Boolean);
  const totals = summaries.reduce((result, summary) => ({
    count: result.count + summary.count,
    discount: result.discount + summary.discount,
    items: result.items + summary.items,
    pending: result.pending + summary.pending,
    shipping: result.shipping + (summary.shipping || 0),
    tax: result.tax + summary.tax,
    total: result.total + summary.total,
  }), {
    count: 0,
    discount: 0,
    items: 0,
    pending: 0,
    shipping: 0,
    tax: 0,
    total: 0,
  });

  return {
    activeCustomersCount,
    customersCount,
    directSummary,
    onlineSummary,
    productionSummary,
    recentActivity,
    topProducts,
    totals,
  };
}

function SummaryFlowCard({ helper, icon: Icon, label, summary }) {
  return (
    <article className="admin-summary-flow-card">
      <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
      <div>
        <span>{label}</span>
        <strong>{formatMoney(summary?.total || 0)}</strong>
        <small>{summary?.count || 0} registro(s) · {summary?.pending || 0} pendiente(s)</small>
        <em>{helper}</em>
      </div>
    </article>
  );
}

export default async function AdminCommercialSummaryPage({ searchParams }) {
  const params = normalizeSearchParams(await searchParams);
  const summary = await getCommercialSummary(params);

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Resumen</span>
          <h1>Resumen comercial</h1>
          <p className="text-muted">
            Mira el rendimiento del módulo por ventas directas, ventas online, pedidos a fábrica y clientes.
          </p>
        </div>
      </div>

      <SummaryLiveFilters currentEndDate={params.endDate} currentFlow={params.flow} currentMonth={params.month} currentStartDate={params.startDate} />

      <section className="admin-order-metrics" aria-label="Resumen principal">
        <article className="admin-order-metric">
          <DollarSign size={19} strokeWidth={1.8} aria-hidden="true" />
          <div>
            <span>Total comercial</span>
            <strong>{formatMoney(summary.totals.total)}</strong>
            <small>{summary.totals.count} operación(es)</small>
          </div>
        </article>
        <article className="admin-order-metric">
          <Boxes size={19} strokeWidth={1.8} aria-hidden="true" />
          <div>
            <span>Productos</span>
            <strong>{summary.totals.items}</strong>
            <small>Unidades registradas</small>
          </div>
        </article>
        <article className="admin-order-metric">
          <Clock3 size={19} strokeWidth={1.8} aria-hidden="true" />
          <div>
            <span>Pendientes</span>
            <strong>{summary.totals.pending}</strong>
            <small>Factura, preparación o gestión</small>
          </div>
        </article>
        <article className="admin-order-metric">
          <UsersRound size={19} strokeWidth={1.8} aria-hidden="true" />
          <div>
            <span>Clientes</span>
            <strong>{summary.customersCount}</strong>
            <small>{summary.activeCustomersCount} activos en total</small>
          </div>
        </article>
      </section>

      <section className="admin-summary-flow-grid" aria-label="Resumen por flujo">
        <SummaryFlowCard helper="Caja y local físico" icon={ReceiptText} label="Ventas directas" summary={summary.directSummary} />
        <SummaryFlowCard helper="Compras hechas en la web" icon={ShoppingBag} label="Ventas online" summary={summary.onlineSummary} />
        <SummaryFlowCard helper="Encargos manuales a fábrica" icon={Factory} label="Pedidos a fábrica" summary={summary.productionSummary} />
      </section>

      <section className="admin-summary-grid">
        <article className="admin-customer-detail__panel">
          <div className="admin-customer-section-heading">
            <div>
              <span className="eyebrow">Productos</span>
              <h2>Más movidos</h2>
            </div>
          </div>

          {summary.topProducts.length ? (
            <div className="admin-summary-list">
              {summary.topProducts.map((product) => (
                <div key={`${product.name}-${product.sku}`}>
                  <span>
                    <strong>{product.name}</strong>
                    <small>{product.sku || "Sin SKU"}</small>
                  </span>
                  <span>
                    <strong>{product.quantity}</strong>
                    <small>{formatMoney(product.total)}</small>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-customer-orders-empty">
              <span>Sin productos en esta vista</span>
              <small>Cuando existan movimientos en el periodo aparecerán aquí.</small>
            </div>
          )}
        </article>

        <article className="admin-customer-detail__panel">
          <div className="admin-customer-section-heading">
            <div>
              <span className="eyebrow">Actividad</span>
              <h2>Últimos movimientos</h2>
            </div>
          </div>

          {summary.recentActivity.length ? (
            <div className="admin-summary-list">
              {summary.recentActivity.map((item) => (
                <div key={`${item.type}-${item.label}`}>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.type} · {item.customer}</small>
                  </span>
                  <span>
                    <strong>{formatMoney(item.amount)}</strong>
                    <small>{formatDate(item.date)}</small>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-customer-orders-empty">
              <span>Sin actividad en esta vista</span>
              <small>Los movimientos recientes aparecerán según los filtros seleccionados.</small>
            </div>
          )}
        </article>
      </section>

      <section className="admin-summary-totals">
        <div>
          <span>Descuentos</span>
          <strong>{formatMoney(summary.totals.discount)}</strong>
        </div>
        <div>
          <span>IVA registrado</span>
          <strong>{formatMoney(summary.totals.tax)}</strong>
        </div>
        <div>
          <span>Envíos</span>
          <strong>{formatMoney(summary.totals.shipping)}</strong>
        </div>
        <div>
          <span>Filtro actual</span>
          <strong>{flowLabels[params.flow]}</strong>
        </div>
      </section>
    </div>
  );
}

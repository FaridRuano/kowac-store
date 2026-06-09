import { Eye, Pencil, Plus, Search, UserRound, UserX } from "lucide-react";
import Link from "next/link";

import { deactivateCustomer } from "@/app/admin/clientes/actions";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";

export const metadata = {
  title: "Clientes | Admin Kowac",
};

const CUSTOMERS_PER_PAGE = 10;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeSearchParams(searchParams = {}) {
  const rawPage = Number.parseInt(Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page, 10);

  return {
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
    q: String(Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q || "").trim(),
  };
}

function buildCustomerFilters(q) {
  if (!q) {
    return { isActive: { $ne: false } };
  }

  const searchRegex = new RegExp(escapeRegex(q), "i");

  return {
    isActive: { $ne: false },
    $or: [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { documentNumber: searchRegex },
      { taxName: searchRegex },
    ],
  };
}

async function getCustomersOverview({ page, q }) {
  await connectDB();

  const filters = buildCustomerFilters(q);
  const [totalCustomers, customersWithAccount, totalFilteredCustomers] = await Promise.all([
    Customer.countDocuments({ isActive: { $ne: false } }),
    Customer.countDocuments({ isActive: { $ne: false }, user: { $ne: null } }),
    Customer.countDocuments(filters),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalFilteredCustomers / CUSTOMERS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const customers = await Customer.find(filters)
    .select("firstName lastName email phone user updatedAt")
    .populate({ path: "user", select: "isActive" })
    .sort({ updatedAt: -1 })
    .skip((currentPage - 1) * CUSTOMERS_PER_PAGE)
    .limit(CUSTOMERS_PER_PAGE)
    .lean();

  return {
    currentPage,
    customers: customers.map((customer) => {
      return {
        email: customer.email,
        fullName: `${customer.firstName} ${customer.lastName}`.trim(),
        hasActiveAccount: Boolean(customer.user?.isActive),
        id: customer._id.toString(),
        phone: customer.phone || "Sin teléfono",
      };
    }),
    metrics: [
      {
        label: "Clientes total",
        value: totalCustomers,
        helper: `${totalFilteredCustomers} en esta vista`,
      },
      {
        label: "Clientes con cuenta",
        value: customersWithAccount,
        helper: "Pueden iniciar sesión en tienda",
      },
    ],
    totalFilteredCustomers,
    totalPages,
  };
}

function buildPageHref(page, q) {
  const params = new URLSearchParams();

  if (q) {
    params.set("q", q);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const queryString = params.toString();
  return `/admin/clientes${queryString ? `?${queryString}` : ""}`;
}

export default async function AdminCustomersPage({ searchParams }) {
  const params = normalizeSearchParams(await searchParams);
  const overview = await getCustomersOverview(params);

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Clientes</span>
          <h1>Base de clientes</h1>
          <p className="text-muted">
            Consulta datos de contacto, direcciones registradas y actividad comercial antes de gestionar pedidos.
          </p>
        </div>
        <div className="admin-page__header-actions">
          <Link href="/admin/clientes/nuevo" className="admin-page__action-pill">
            <Plus size={15} strokeWidth={1.8} aria-hidden="true" />
            Nuevo cliente
          </Link>
        </div>
      </div>

      <section className="admin-customer-metrics" aria-label="Resumen de clientes">
        {overview.metrics.map((metric) => (
          <article key={metric.label} className="admin-customer-metric">
            <UserRound size={19} strokeWidth={1.8} aria-hidden="true" />
            <div>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.helper}</small>
            </div>
          </article>
        ))}
      </section>

      <form className="admin-customer-search" action="/admin/clientes">
        <label>
          <span>Buscar cliente</span>
          <div>
            <Search size={16} strokeWidth={1.8} aria-hidden="true" />
            <input
              type="search"
              name="q"
              defaultValue={params.q}
              placeholder="Nombre, email o teléfono"
            />
          </div>
        </label>
        <button type="submit">Buscar</button>
        {params.q ? (
          <Link href="/admin/clientes" className="admin-page__action-pill">
            Limpiar
          </Link>
        ) : null}
      </form>

      {overview.customers.length ? (
        <>
          <div className="admin-page__table-wrap">
            <table className="admin-page__table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Cuenta activa</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {overview.customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="admin-page__primary-cell">
                      <strong>{customer.fullName}</strong>
                      <span>{customer.email}</span>
                    </td>
                    <td>{customer.phone}</td>
                    <td>
                      <span className={`admin-page__status ${customer.hasActiveAccount ? "admin-page__status--success" : "admin-page__status--muted"}`}>
                        {customer.hasActiveAccount ? "Activa" : "Sin cuenta"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        <Link
                          href={`/admin/clientes/${customer.id}`}
                          className="admin-icon-button admin-icon-button--secondary admin-table-icon-link"
                          aria-label={`Ver detalle de ${customer.fullName}`}
                          title="Ver detalle"
                        >
                          <Eye size={16} strokeWidth={1.8} aria-hidden="true" />
                        </Link>
                        <Link
                          href={`/admin/clientes/${customer.id}/editar`}
                          className="admin-icon-button admin-icon-button--secondary admin-table-icon-link"
                          aria-label={`Editar ${customer.fullName}`}
                          title="Editar cliente"
                        >
                          <Pencil size={16} strokeWidth={1.8} aria-hidden="true" />
                        </Link>
                        <form action={deactivateCustomer.bind(null, customer.id)}>
                          <button
                            type="submit"
                            className="admin-icon-button admin-icon-button--danger admin-table-icon-link admin-table-icon-link--danger"
                            aria-label={`Desactivar ${customer.fullName}`}
                            title="Desactivar cliente"
                          >
                            <UserX size={16} strokeWidth={1.8} aria-hidden="true" />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-customer-pagination">
            <Link
              href={buildPageHref(Math.max(1, overview.currentPage - 1), params.q)}
              aria-disabled={overview.currentPage === 1}
              className={overview.currentPage === 1 ? "is-disabled" : ""}
            >
              Anterior
            </Link>
            <span>
              Página {overview.currentPage} de {overview.totalPages}
            </span>
            <Link
              href={buildPageHref(Math.min(overview.totalPages, overview.currentPage + 1), params.q)}
              aria-disabled={overview.currentPage === overview.totalPages}
              className={overview.currentPage === overview.totalPages ? "is-disabled" : ""}
            >
              Siguiente
            </Link>
          </div>
        </>
      ) : (
        <div className="admin-page__empty">
          <strong>No encontramos clientes.</strong>
          <span>Ajusta la búsqueda o limpia el filtro para volver al listado completo.</span>
        </div>
      )}
    </div>
  );
}

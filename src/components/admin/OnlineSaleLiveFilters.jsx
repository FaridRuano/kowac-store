"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

export default function OnlineSaleLiveFilters({
  currentPaymentStatus = "",
  currentQuery = "",
  currentStatus = "",
  paymentStatusLabels = {},
  statusLabels = {},
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState(currentPaymentStatus);
  const [query, setQuery] = useState(currentQuery);
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  const buildUrl = useCallback((overrides = {}) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(overrides)) {
      if (value === "" || value === null || value === undefined) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    }

    const queryString = params.toString();

    return queryString ? `${pathname}?${queryString}` : pathname;
  }, [pathname, searchParams]);

  const navigate = useCallback((overrides) => {
    startTransition(() => {
      router.replace(buildUrl(overrides), { scroll: false });
    });
  }, [buildUrl, router]);

  useEffect(() => {
    const nextQuery = query.trim();

    if (nextQuery === currentQuery && status === currentStatus && paymentStatus === currentPaymentStatus) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      navigate({
        page: 1,
        pago: paymentStatus,
        q: nextQuery,
        status,
      });
    }, 260);

    return () => window.clearTimeout(timeoutId);
  }, [currentPaymentStatus, currentQuery, currentStatus, navigate, paymentStatus, query, status]);

  function handleClear() {
    setPaymentStatus("");
    setQuery("");
    setStatus("");
    navigate({
      page: 1,
      pago: "",
      q: "",
      status: "",
    });
  }

  const hasFilters = Boolean(query.trim() || status || paymentStatus);

  return (
    <div className={`admin-order-search admin-order-search--live admin-order-search--sales ${hasFilters ? "admin-order-search--sales-with-actions" : ""} ${isPending ? "is-loading" : ""}`}>
      <label>
        <span>Buscar venta</span>
        <div>
          <Search size={16} strokeWidth={1.8} aria-hidden="true" />
          <input
            aria-label="Buscar venta online por venta, cliente, email o teléfono"
            type="search"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Venta online, cliente, email o teléfono"
          />
        </div>
      </label>
      <label>
        <span>Estado</span>
        <select
          aria-label="Filtrar ventas online por estado"
          name="status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">Todos</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Pago</span>
        <select
          aria-label="Filtrar ventas online por pago"
          name="pago"
          value={paymentStatus}
          onChange={(event) => setPaymentStatus(event.target.value)}
        >
          <option value="">Todos</option>
          {Object.entries(paymentStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {hasFilters ? (
        <button type="button" onClick={handleClear} disabled={isPending} aria-label="Limpiar filtros" title="Limpiar filtros">
          <X size={16} strokeWidth={1.8} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

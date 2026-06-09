"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

export default function OrderLiveFilters({
  currentQuery = "",
  currentStatus = "",
  statusLabels = {},
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
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

    if (nextQuery === currentQuery && status === currentStatus) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      navigate({
        page: 1,
        q: nextQuery,
        status,
      });
    }, 260);

    return () => window.clearTimeout(timeoutId);
  }, [currentQuery, currentStatus, navigate, query, status]);

  function handleClear() {
    setQuery("");
    setStatus("");
    navigate({
      page: 1,
      q: "",
      status: "",
    });
  }

  const hasFilters = Boolean(query.trim() || status);

  return (
    <div className={`admin-order-search admin-order-search--live ${hasFilters ? "admin-order-search--with-actions" : ""} ${isPending ? "is-loading" : ""}`}>
      <label>
        <span>Buscar cliente</span>
        <div>
          <Search size={16} strokeWidth={1.8} aria-hidden="true" />
          <input
            aria-label="Buscar pedido por cliente, email o teléfono"
            type="search"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nombre, email o teléfono"
          />
        </div>
      </label>
      <label>
        <span>Estado</span>
        <select
          aria-label="Filtrar pedidos por estado"
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
      {hasFilters ? (
        <button type="button" onClick={handleClear} disabled={isPending} aria-label="Limpiar filtros" title="Limpiar filtros">
          <X size={16} strokeWidth={1.8} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

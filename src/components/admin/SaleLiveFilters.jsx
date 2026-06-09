"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

export default function SaleLiveFilters({
  currentInvoiceStatus = "",
  currentPaymentMethod = "",
  currentQuery = "",
  invoiceStatusLabels = {},
  paymentMethodLabels = {},
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invoiceStatus, setInvoiceStatus] = useState(currentInvoiceStatus);
  const [paymentMethod, setPaymentMethod] = useState(currentPaymentMethod);
  const [query, setQuery] = useState(currentQuery);
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

    if (nextQuery === currentQuery && paymentMethod === currentPaymentMethod && invoiceStatus === currentInvoiceStatus) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      navigate({
        factura: invoiceStatus,
        page: 1,
        pago: paymentMethod,
        q: nextQuery,
      });
    }, 260);

    return () => window.clearTimeout(timeoutId);
  }, [currentInvoiceStatus, currentPaymentMethod, currentQuery, invoiceStatus, navigate, paymentMethod, query]);

  function handleClear() {
    setInvoiceStatus("");
    setPaymentMethod("");
    setQuery("");
    navigate({
      factura: "",
      page: 1,
      pago: "",
      q: "",
    });
  }

  const hasFilters = Boolean(query.trim() || paymentMethod || invoiceStatus);

  return (
    <div className={`admin-order-search admin-order-search--live admin-order-search--sales ${hasFilters ? "admin-order-search--sales-with-actions" : ""} ${isPending ? "is-loading" : ""}`}>
      <label>
        <span>Buscar venta</span>
        <div>
          <Search size={16} strokeWidth={1.8} aria-hidden="true" />
          <input
            aria-label="Buscar venta por venta, cliente, email o documento"
            type="search"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Venta, cliente, email o documento"
          />
        </div>
      </label>
      <label>
        <span>Pago</span>
        <select
          aria-label="Filtrar ventas por método de pago"
          name="pago"
          value={paymentMethod}
          onChange={(event) => setPaymentMethod(event.target.value)}
        >
          <option value="">Todos</option>
          {Object.entries(paymentMethodLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Factura</span>
        <select
          aria-label="Filtrar ventas por factura"
          name="factura"
          value={invoiceStatus}
          onChange={(event) => setInvoiceStatus(event.target.value)}
        >
          <option value="">Todas</option>
          {Object.entries(invoiceStatusLabels).map(([value, label]) => (
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

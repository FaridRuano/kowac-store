"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

const flowLabels = {
  all: "Todos",
  direct: "Ventas directas",
  online: "Ventas online",
  production: "Pedidos a fábrica",
};

export default function SummaryLiveFilters({
  currentEndDate = "",
  currentFlow = "all",
  currentMonth = "",
  currentStartDate = "",
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [endDate, setEndDate] = useState(currentEndDate);
  const [flow, setFlow] = useState(currentFlow);
  const [isPending, startTransition] = useTransition();
  const [month, setMonth] = useState(currentMonth);
  const [startDate, setStartDate] = useState(currentStartDate);

  const buildUrl = useCallback((overrides = {}) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(overrides)) {
      if (value === "" || value === null || value === undefined || value === "all") {
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
    if (startDate === currentStartDate && endDate === currentEndDate && flow === currentFlow && month === currentMonth) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      navigate({
        desde: startDate,
        flujo: flow,
        hasta: endDate,
        mes: month,
      });
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [currentEndDate, currentFlow, currentMonth, currentStartDate, endDate, flow, month, navigate, startDate]);

  function handleClear() {
    setEndDate("");
    setFlow("all");
    setMonth("");
    setStartDate("");
    navigate({
      desde: "",
      flujo: "all",
      hasta: "",
      mes: "",
    });
  }

  function handleDateChange(nextField, value) {
    setMonth("");

    if (nextField === "start") {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
  }

  function handleMonthChange(value) {
    setEndDate("");
    setMonth(value);
    setStartDate("");
  }

  const hasFilters = Boolean(startDate || endDate || month || flow !== "all");

  return (
    <details className={`admin-summary-filter-panel ${hasFilters ? "is-filtered" : ""}`} open={hasFilters}>
      <summary>
        <span>
          <SlidersHorizontal size={16} strokeWidth={1.8} aria-hidden="true" />
          Filtros
        </span>
        {hasFilters ? <small>Activos</small> : <small>Sin filtros</small>}
      </summary>

      <div className={`admin-order-search admin-order-search--live admin-order-search--summary ${hasFilters ? "admin-order-search--summary-with-actions" : ""} ${isPending ? "is-loading" : ""}`}>
        <label>
          <span>Desde</span>
          <input
            aria-label="Fecha inicial"
            type="date"
            name="desde"
            value={startDate}
            onChange={(event) => handleDateChange("start", event.target.value)}
          />
        </label>
        <label>
          <span>Hasta</span>
          <input
            aria-label="Fecha final"
            type="date"
            name="hasta"
            value={endDate}
            onChange={(event) => handleDateChange("end", event.target.value)}
          />
        </label>
        <label>
          <span>Mes</span>
          <input
            aria-label="Filtrar por mes"
            type="month"
            name="mes"
            value={month}
            onChange={(event) => handleMonthChange(event.target.value)}
          />
        </label>
        <label>
          <span>Flujo</span>
          <select
            aria-label="Filtrar resumen por flujo"
            name="flujo"
            value={flow}
            onChange={(event) => setFlow(event.target.value)}
          >
            {Object.entries(flowLabels).map(([value, label]) => (
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
    </details>
  );
}

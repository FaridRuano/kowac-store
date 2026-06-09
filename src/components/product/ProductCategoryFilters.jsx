"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

const sortOptions = [
  { label: "Más recientes", value: "newest" },
  { label: "Precio: menor a mayor", value: "price-asc" },
  { label: "Precio: mayor a menor", value: "price-desc" },
  { label: "En tendencia", value: "trending" },
];

export default function ProductCategoryFilters({
  colorOptions = [],
  currentColor = "",
  currentMaxPrice = "",
  currentMinPrice = "",
  currentQuery = "",
  currentSize = "",
  currentSort = "newest",
  currentTag = "",
  resultCount = 0,
  sizeOptions = [],
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [color, setColor] = useState(currentColor);
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice);
  const [minPrice, setMinPrice] = useState(currentMinPrice);
  const [query, setQuery] = useState(currentQuery);
  const [size, setSize] = useState(currentSize);
  const [sort, setSort] = useState(currentSort);
  const [tag, setTag] = useState(currentTag);
  const [isPending, startTransition] = useTransition();

  const buildUrl = useCallback((overrides = {}) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(overrides)) {
      if (value === "" || value === null || value === undefined || value === "newest") {
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

    if (
      nextQuery === currentQuery &&
      size === currentSize &&
      color === currentColor &&
      minPrice === currentMinPrice &&
      maxPrice === currentMaxPrice &&
      sort === currentSort &&
      tag === currentTag
    ) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      navigate({
        color,
        max: maxPrice,
        min: minPrice,
        q: nextQuery,
        size,
        sort,
        tag,
      });
    }, 240);

    return () => window.clearTimeout(timeoutId);
  }, [
    color,
    currentColor,
    currentMaxPrice,
    currentMinPrice,
    currentQuery,
    currentSize,
    currentSort,
    currentTag,
    maxPrice,
    minPrice,
    navigate,
    query,
    size,
    sort,
    tag,
  ]);

  function handleClear() {
    setColor("");
    setMaxPrice("");
    setMinPrice("");
    setQuery("");
    setSize("");
    setSort("newest");
    setTag("");
    navigate({
      color: "",
      max: "",
      min: "",
      q: "",
      size: "",
      sort: "",
      tag: "",
    });
  }

  const hasFilters = Boolean(query.trim() || size || color || minPrice || maxPrice || tag || sort !== "newest");

  return (
    <aside className={`catalog-filter-sidebar ${isPending ? "catalog-filter-sidebar--loading" : ""}`} aria-label="Filtros de zapatos">
      <div className="catalog-filter-sidebar__header">
        <strong>Filtros</strong>
        <span>{resultCount} resultado(s)</span>
      </div>

      <label className="catalog-filter-sidebar__search">
        <span>Buscar</span>
        <div>
          <Search size={16} strokeWidth={1.9} aria-hidden="true" />
          <input
            aria-label="Buscar zapatos"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nombre o SKU"
            value={query}
          />
        </div>
      </label>

      <label>
        <span>Talla</span>
        <select aria-label="Filtrar por talla" onChange={(event) => setSize(event.target.value)} value={size}>
          <option value="">Todas</option>
          {sizeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Color</span>
        <select aria-label="Filtrar por color" onChange={(event) => setColor(event.target.value)} value={color}>
          <option value="">Todos</option>
          {colorOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="catalog-filter-sidebar__price">
        <span>Precio</span>
        <label>
          <span>Mín.</span>
          <input
            aria-label="Precio mínimo"
            inputMode="decimal"
            onChange={(event) => setMinPrice(normalizeMoney(event.target.value))}
            placeholder="0"
            value={minPrice}
          />
        </label>
        <label>
          <span>Máx.</span>
          <input
            aria-label="Precio máximo"
            inputMode="decimal"
            onChange={(event) => setMaxPrice(normalizeMoney(event.target.value))}
            placeholder="250"
            value={maxPrice}
          />
        </label>
      </div>

      <label>
        <span>Ordenar</span>
        <select aria-label="Ordenar productos" onChange={(event) => setSort(event.target.value)} value={sort}>
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="catalog-filter-sidebar__tags" aria-label="Etiquetas comerciales">
        <span>Mostrar</span>
        <button type="button" className={tag === "new" ? "is-active" : ""} onClick={() => setTag(tag === "new" ? "" : "new")}>
          Nuevos
        </button>
        <button type="button" className={tag === "trending" ? "is-active" : ""} onClick={() => setTag(tag === "trending" ? "" : "trending")}>
          Tendencia
        </button>
      </div>

      {hasFilters ? (
        <button type="button" className="catalog-filter-sidebar__clear" onClick={handleClear}>
          <X size={16} strokeWidth={1.9} aria-hidden="true" />
          Limpiar filtros
        </button>
      ) : null}
    </aside>
  );
}

function normalizeMoney(value) {
  return value
    .replace(/[^\d.]/g, "")
    .replace(/(\..*)\./g, "$1")
    .replace(/^(\d+)(\.\d{0,2})?.*$/, "$1$2");
}

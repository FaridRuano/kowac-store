"use client";

import { ChevronDown, Grid2X2, RectangleVertical, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

const sortOptions = [
  { label: "Más nuevo", value: "newest" },
  { label: "Precio: menor a mayor", value: "price-asc" },
  { label: "Precio: mayor a menor", value: "price-desc" },
];

export default function ProductCategoryFilters({
  colorOptions = [],
  currentColor = "",
  currentFit = "",
  currentSize = "",
  currentSort = "newest",
  fitOptions = [],
  label = "productos",
  resultCount = 0,
  sizeOptions = [],
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [color, setColor] = useState(currentColor);
  const [fit, setFit] = useState(currentFit);
  const [size, setSize] = useState(currentSize);
  const [sort, setSort] = useState(currentSort);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [mobileGridMode, setMobileGridMode] = useState("2");
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
    if (
      size === currentSize &&
      color === currentColor &&
      fit === currentFit &&
      sort === currentSort
    ) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      navigate({
        color,
        fit,
        size,
        sort,
      });
    }, 240);

    return () => window.clearTimeout(timeoutId);
  }, [
    color,
    currentColor,
    currentFit,
    currentSize,
    currentSort,
    fit,
    navigate,
    size,
    sort,
  ]);

  useEffect(() => {
    if (!isMobileFilterOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileFilterOpen]);

  useEffect(() => {
    document.documentElement.dataset.catalogMobileGrid = mobileGridMode;
  }, [mobileGridMode]);

  return (
    <>
      <div className="catalog-mobile-toolbar" aria-label="Controles de catálogo móvil">
        <div className="catalog-mobile-view-toggle" aria-label="Vista de productos">
          <button
            type="button"
            className={mobileGridMode === "2" ? "is-active" : ""}
            onClick={() => setMobileGridMode("2")}
            aria-label="Ver dos productos por fila"
            aria-pressed={mobileGridMode === "2"}
          >
            <Grid2X2 size={23} strokeWidth={2.2} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={mobileGridMode === "1" ? "is-active" : ""}
            onClick={() => setMobileGridMode("1")}
            aria-label="Ver un producto por fila"
            aria-pressed={mobileGridMode === "1"}
          >
            <RectangleVertical size={25} strokeWidth={2.1} aria-hidden="true" />
          </button>
        </div>

        <button type="button" className="catalog-filter-mobile-trigger" onClick={() => setIsMobileFilterOpen(true)}>
          <SlidersHorizontal size={21} strokeWidth={2.1} aria-hidden="true" />
          Filtrar y ordenar
        </button>
      </div>

      <div
        className={`catalog-filter-mobile-backdrop ${isMobileFilterOpen ? "is-open" : ""}`}
        aria-hidden="true"
        onClick={() => setIsMobileFilterOpen(false)}
      />

      <aside
        className={`catalog-filter-sidebar ${isPending ? "catalog-filter-sidebar--loading" : ""} ${isMobileFilterOpen ? "is-mobile-open" : ""}`}
        aria-label={`Filtros de ${label}`}
        aria-modal={isMobileFilterOpen ? "true" : undefined}
        role={isMobileFilterOpen ? "dialog" : undefined}
      >
        <div className="catalog-filter-sidebar__header">
          <button type="button" className="catalog-filter-sidebar__close" onClick={() => setIsMobileFilterOpen(false)} aria-label="Cerrar filtros">
            <X size={30} strokeWidth={1.7} aria-hidden="true" />
          </button>
          <strong>Filtrar y ordenar</strong>
        </div>

        <div className="catalog-filter-sidebar__body">
          <details className="catalog-filter-section" open>
            <summary>
              <span>Ordenar por</span>
              <ChevronDown size={16} strokeWidth={1.9} aria-hidden="true" />
            </summary>
            <div className="catalog-filter-section__options">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`catalog-filter-radio ${sort === option.value ? "is-active" : ""}`}
                  onClick={() => setSort(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </details>

          <details className="catalog-filter-section">
            <summary>
              <span>Talla</span>
              <ChevronDown size={16} strokeWidth={1.9} aria-hidden="true" />
            </summary>
            <div className="catalog-filter-section__options catalog-filter-size-grid">
              <button type="button" className={!size ? "is-active" : ""} onClick={() => setSize("")}>
                Todas
              </button>
              {sizeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={size === option.value ? "is-active" : ""}
                  onClick={() => setSize(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </details>

          <details className="catalog-filter-section">
            <summary>
              <span>Color</span>
              <ChevronDown size={16} strokeWidth={1.9} aria-hidden="true" />
            </summary>
            <div className="catalog-filter-section__options catalog-filter-color-list">
              <button type="button" className={!color ? "is-active" : ""} onClick={() => setColor("")}>
                <span aria-hidden="true" />
                Todos
              </button>
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={color === option.value ? "is-active" : ""}
                  onClick={() => setColor(option.value)}
                >
                  <span style={{ backgroundColor: option.hex || "#d8c7ae" }} aria-hidden="true" />
                  {option.label}
                </button>
              ))}
            </div>
          </details>

          {fitOptions.length ? (
            <details className="catalog-filter-section">
              <summary>
                <span>Corte</span>
                <ChevronDown size={16} strokeWidth={1.9} aria-hidden="true" />
              </summary>
              <div className="catalog-filter-section__options catalog-filter-size-grid">
                <button type="button" className={!fit ? "is-active" : ""} onClick={() => setFit("")}>
                  Todos
                </button>
                {fitOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={fit === option.value ? "is-active" : ""}
                    onClick={() => setFit(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </details>
          ) : null}

          <span className="catalog-filter-sidebar__count">{resultCount} resultado(s)</span>
        </div>

        {isMobileFilterOpen ? (
          <button type="button" className="catalog-filter-sidebar__apply" onClick={() => setIsMobileFilterOpen(false)}>
            Ver productos ({resultCount})
          </button>
        ) : null}
      </aside>
    </>
  );
}

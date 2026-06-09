"use client";

import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

export default function ProductCatalogControls({
  categories = [],
  currentCategory = "",
  currentPage = 1,
  currentQuery = "",
  totalPages = 1,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [category, setCategory] = useState(currentCategory);
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

    if (nextQuery === currentQuery && category === currentCategory) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      navigate({
        category,
        page: 1,
        q: nextQuery,
      });
    }, 280);

    return () => window.clearTimeout(timeoutId);
  }, [category, currentCategory, currentQuery, navigate, query]);

  function handleClear() {
    setCategory("");
    setQuery("");
    navigate({
      category: "",
      page: 1,
      q: "",
    });
  }

  function goToPage(nextPage) {
    const safePage = Math.min(Math.max(1, nextPage), totalPages);

    navigate({ page: safePage });
  }

  const hasFilters = Boolean(query.trim() || category);

  return (
    <div className={`admin-product-list-toolbar ${isPending ? "admin-product-list-toolbar--loading" : ""}`}>
      <div className={`admin-product-list-controls ${hasFilters ? "admin-product-list-controls--with-actions" : ""}`}>
        <label>
          <div className="admin-product-list-controls__search">
            <Search size={16} strokeWidth={1.9} aria-hidden="true" />
            <input
              aria-label="Buscar productos"
              name="q"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar producto"
              value={query}
            />
          </div>
        </label>

        <label>
          <select
            aria-label="Filtrar por categoría"
            name="category"
            onChange={(event) => setCategory(event.target.value)}
            value={category}
          >
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        {hasFilters ? (
          <div className="admin-product-list-controls__actions">
            <button type="button" onClick={handleClear} disabled={isPending} aria-label="Limpiar filtros" title="Limpiar filtros">
              <X size={16} strokeWidth={1.9} aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="admin-product-list-pagination" aria-label="Paginación de productos">
        <button
          type="button"
          onClick={() => goToPage(currentPage - 1)}
          disabled={isPending || currentPage <= 1}
          aria-label="Página anterior"
          title="Página anterior"
        >
          <ChevronLeft size={16} strokeWidth={1.9} aria-hidden="true" />
        </button>
        <span>
          Página {currentPage} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => goToPage(currentPage + 1)}
          disabled={isPending || currentPage >= totalPages}
          aria-label="Página siguiente"
          title="Página siguiente"
        >
          <ChevronRight size={16} strokeWidth={1.9} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

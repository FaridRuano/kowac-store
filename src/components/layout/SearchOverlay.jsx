"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect } from "react";
import { X } from "lucide-react";
import Link from "next/link";

import { useLanguage } from "@/components/providers/LanguageProvider";

import styles from "./SearchOverlay.module.scss";

function formatPrice(value, locale) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

export default function SearchOverlay({ isOpen, query, onQueryChange, results = [], onClose }) {
  const { dictionary, language } = useLanguage();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const locale = language === "en" ? "en-US" : "es-EC";

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={dictionary.search.dialogLabel}
    >
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.inputWrap}>
            <input
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={dictionary.search.placeholder}
              className={styles.input}
              autoFocus
            />

            {query ? (
              <button
                type="button"
                className={styles.clearButton}
                aria-label="Limpiar búsqueda"
                onClick={() => onQueryChange("")}
              >
                <X size={14} strokeWidth={1.7} />
              </button>
            ) : null}
          </div>

          <button type="button" onClick={onClose} className={styles.closeButton}>
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className={styles.resultsRail}>
          {results.length ? (
            results.map((product) => {
              const image = product?.images?.[0] || "";

              return (
                <Link
                  key={product.slug}
                  href={`/producto/${product.slug}`}
                  className={styles.resultCard}
                  onClick={onClose}
                >
                  <div className={styles.resultMedia}>
                    {image ? (
                      <img src={image} alt={product.name} />
                    ) : (
                      <div className={styles.resultPlaceholder}>{dictionary.search.imagePlaceholder}</div>
                    )}
                  </div>

                  <div className={styles.resultBody}>
                    <span className={styles.resultCategory}>{product.categoryLabel || product.type}</span>
                    <strong>{product.name}</strong>
                    <span className={styles.resultPrice}>{formatPrice(product.price, locale)}</span>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className={styles.emptyState}>
              <strong>{dictionary.search.noResults}</strong>
              <span>{dictionary.search.tryAnother}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

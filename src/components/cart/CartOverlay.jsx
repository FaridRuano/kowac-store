"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

import { useLanguage } from "@/components/providers/LanguageProvider";

import CartEmptyState from "./CartEmptyState";
import styles from "./CartOverlay.module.scss";

export default function CartOverlay({ isOpen, onClose }) {
  const { dictionary } = useLanguage();

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

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={dictionary.cart.title}
      onClick={onClose}
    >
      <aside className={styles.panel} onClick={(event) => event.stopPropagation()}>
        <header className={styles.header}>
          <h2>{dictionary.cart.title}</h2>
          <button
            type="button"
            className={styles.closeButton}
            aria-label={dictionary.actions.closeCart}
            onClick={onClose}
          >
            <X size={19} strokeWidth={1.9} />
          </button>
        </header>

        <div className={styles.body}>
          <CartEmptyState dictionary={dictionary} onNavigate={onClose} />
        </div>
      </aside>
    </div>
  );
}

"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function AdminToast({ message, onClose, title, type = "success" }) {
  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(onClose, 3600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [message, onClose]);

  if (typeof document === "undefined" || !message) {
    return null;
  }

  const Icon = type === "error" ? XCircle : CheckCircle2;

  return createPortal(
    <div className={`admin-toast admin-toast--${type}`} role="status" aria-live="polite">
      <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <span>{message}</span>
      </div>
      <button type="button" aria-label="Cerrar notificación" onClick={onClose}>
        Cerrar
      </button>
    </div>,
    document.body
  );
}

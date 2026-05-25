"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export default function LogoutButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);

    try {
      await signOut({ callbackUrl: "/login" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button type="button" className="button-secondary" onClick={handleLogout} disabled={isSubmitting}>
      {isSubmitting ? "Cerrando..." : "Cerrar sesión"}
    </button>
  );
}

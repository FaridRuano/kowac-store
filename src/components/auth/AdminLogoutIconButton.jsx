"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

export default function AdminLogoutIconButton({ className = "" }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <button
      type="button"
      className={className}
      aria-label="Cerrar sesión"
      onClick={handleLogout}
      disabled={isSubmitting}
    >
      <LogOut size={21} strokeWidth={1.9} />
      <span>Cerrar sesión</span>
    </button>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { isInternalRole } from "@/lib/roles";

import styles from "./LoginForm.module.scss";

export default function LoginForm({ redirectTo = "" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (!response?.ok) {
        setMessage("Credenciales inválidas.");
        return;
      }

      const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" });
      const session = await sessionResponse.json();
      const fallbackPath = isInternalRole(session?.user?.role) ? "/admin" : "/perfil";

      router.replace(redirectTo || fallbackPath);
      router.refresh();
    } catch (error) {
      setMessage("No se pudo conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="correo@kowac.com"
          autoComplete="email"
          required
        />
      </label>

      <label className={styles.field}>
        <span>Contraseña</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="********"
          autoComplete="current-password"
          required
        />
      </label>

      {message ? <p className={styles.message}>{message}</p> : null}

      <button type="submit" className="button-primary" disabled={isSubmitting}>
        {isSubmitting ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";

import LoginForm from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/session";

import styles from "./page.module.scss";

export const metadata = {
  title: "Login | Kowac",
};

function getSafeRedirect(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "";
  }

  return value;
}

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const redirectTo = getSafeRedirect(params?.redirect);
  const user = await getCurrentUser();

  if (user) {
    redirect(redirectTo || (user.isInternal ? "/admin" : "/perfil"));
  }

  return (
    <section className={`${styles.loginPage} auth-page`}>
      <div className="container">
        <div className={styles.shell}>
          <Link href="/" className={styles.brand} aria-label="Ir al inicio de Kowac">
            KOWAC
          </Link>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Iniciar sesión</h2>
              <p>Usa tu correo y contraseña registrados.</p>
            </div>
            <LoginForm redirectTo={redirectTo} />
          </div>
        </div>
      </div>
    </section>
  );
}

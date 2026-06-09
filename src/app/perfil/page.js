import { redirect } from "next/navigation";

import LogoutButton from "@/components/auth/LogoutButton";
import { getCurrentUser } from "@/lib/session";

export const metadata = {
  title: "Perfil | Kowac",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/perfil");
  }

  return (
    <section className="simple-page">
      <div className="container">
        <div className="simple-page__box card-surface stack-md">
          <span className="eyebrow">Perfil</span>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "3rem" }}>
            Cuenta de usuario
          </h1>
          <p className="text-muted" style={{ margin: 0 }}>
            {user.name} · {user.email} · {user.role}
          </p>
          <p className="text-muted" style={{ margin: 0 }}>
            {user.customerId ? "Cuenta vinculada a cliente." : "Cuenta sin perfil de cliente vinculado."}
          </p>
          <LogoutButton />
        </div>
      </div>
    </section>
  );
}

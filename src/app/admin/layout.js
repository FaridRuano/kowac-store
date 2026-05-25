import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/session";

export default async function AdminLayout({ children }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  if (!user.isInternal) {
    redirect("/perfil");
  }

  return (
    <section className="admin-module">
      {children}
    </section>
  );
}

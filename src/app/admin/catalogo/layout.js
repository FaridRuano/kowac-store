import AdminModuleShell from "@/components/admin/AdminModuleShell";
import { getCurrentUser } from "@/lib/session";

export default async function AdminCatalogLayout({ children }) {
  const user = await getCurrentUser();

  return (
    <AdminModuleShell module="catalogo" user={user}>
      {children}
    </AdminModuleShell>
  );
}

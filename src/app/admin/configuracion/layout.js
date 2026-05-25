import AdminModuleShell from "@/components/admin/AdminModuleShell";
import { getCurrentUser } from "@/lib/session";

export default async function AdminConfigurationLayout({ children }) {
  const user = await getCurrentUser();

  return (
    <AdminModuleShell module="configuracion" user={user}>
      {children}
    </AdminModuleShell>
  );
}

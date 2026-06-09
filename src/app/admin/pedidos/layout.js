import AdminModuleShell from "@/components/admin/AdminModuleShell";
import { getCurrentUser } from "@/lib/session";

export default async function AdminOrdersLayout({ children }) {
  const user = await getCurrentUser();

  return (
    <AdminModuleShell module="ventas" user={user}>
      {children}
    </AdminModuleShell>
  );
}

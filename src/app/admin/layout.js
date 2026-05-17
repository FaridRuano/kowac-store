import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }) {
  return (
    <section className="simple-page">
      <div className="container admin-grid">
        <AdminSidebar />
        <div>{children}</div>
      </div>
    </section>
  );
}

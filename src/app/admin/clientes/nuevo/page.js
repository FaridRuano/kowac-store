import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import CustomerForm from "@/components/admin/CustomerForm";

export const metadata = {
  title: "Nuevo cliente | Admin Kowac",
};

export default function AdminNewCustomerPage() {
  return (
    <div className="admin-page">
      <Link href="/admin/clientes" className="admin-page__action-pill admin-page__back-link">
        <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
        Volver a clientes
      </Link>

      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Clientes</span>
          <h1>Nuevo cliente</h1>
          <p className="text-muted">
            Registra datos de contacto y facturación para clientes nacionales o extranjeros.
          </p>
        </div>
      </div>

      <CustomerForm />
    </div>
  );
}

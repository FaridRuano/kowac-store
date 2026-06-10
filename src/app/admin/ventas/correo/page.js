import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import AdminEmailForm from "@/components/admin/AdminEmailForm";

export const metadata = {
  title: "Enviar correo | Admin Kowac",
};

export default function AdminSalesEmailPage() {
  return (
    <div className="admin-page">
      <Link href="/admin/ventas" className="admin-page__action-pill admin-page__back-link">
        <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
        Volver a ventas
      </Link>

      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Ventas</span>
          <h1>Correo rápido</h1>
          <p className="text-muted">
            Prueba y envía correos manuales desde las direcciones de Kowac configuradas en Google Workspace.
          </p>
        </div>
      </div>

      <AdminEmailForm />
    </div>
  );
}

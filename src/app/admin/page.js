import { BarChart3, Factory, Package, ReceiptText, Settings, UsersRound } from "lucide-react";
import Link from "next/link";

import AdminLogoutIconButton from "@/components/auth/AdminLogoutIconButton";

export const metadata = {
  title: "Admin | Kowac",
};

const modules = [
  {
    title: "Configuración",
    description: "Empresa, usuarios, accesos y preferencias base del sistema.",
    href: "/admin/configuracion",
    icon: Settings,
    status: "Disponible",
  },
  {
    title: "Catálogo",
    description: "Productos, categorías, variantes, precios e inventario comercial.",
    href: "/admin/catalogo",
    icon: Package,
    status: "Disponible",
  },
  {
    title: "Ventas",
    description: "Clientes, ventas directas, ventas online y pedidos de producción.",
    href: "/admin/ventas",
    icon: ReceiptText,
    status: "Disponible",
  },
  {
    title: "Colaboradores",
    description: "Equipo, permisos, áreas y responsabilidades internas.",
    href: "/admin/configuracion",
    icon: UsersRound,
    status: "Próximo",
  },
  {
    title: "Producción",
    description: "Fabricación, materiales, tiempos y costos operativos.",
    href: "/admin/configuracion",
    icon: Factory,
    status: "Futuro",
  },
  {
    title: "Finanzas",
    description: "Márgenes, egresos, reportes y lectura financiera del negocio.",
    href: "/admin/configuracion",
    icon: BarChart3,
    status: "Futuro",
  },
];

export default function AdminPage() {
  return (
    <div className="admin-selector">
      <Link href="/" className="admin-selector__brand" aria-label="Volver al inicio de Kowac">
        KOWAC
      </Link>
      <AdminLogoutIconButton className="admin-selector__logout" />

      <div className="admin-selector__heading">
        <h1>Módulos de gestión</h1>
        <p>Selecciona el área de trabajo que quieres abrir.</p>
      </div>

      <div className="admin-selector__grid">
        {modules.map((module) => {
          const Icon = module.icon;

          return (
            <Link key={module.title} href={module.href} className="admin-selector__card">
              <span className="admin-selector__status">{module.status}</span>
              <Icon size={44} strokeWidth={1.55} aria-hidden="true" />
              <div>
                <h2>{module.title}</h2>
                <p>{module.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

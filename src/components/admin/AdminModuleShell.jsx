"use client";

import { Bell, Package, PanelLeftOpen, ReceiptText, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import AdminSidebar from "@/components/admin/AdminSidebar";

const moduleConfigs = {
  configuracion: {
    fallbackTitle: "Configuración",
    sectionLabel: "Configuración",
    sectionIcon: Settings,
    items: [
      { href: "/admin/configuracion", label: "General" },
      { href: "/admin/configuracion/tienda", label: "Tienda" },
      { href: "/admin/configuracion/usuarios", label: "Usuarios" },
    ],
    titles: {
      "/admin/configuracion": "General",
      "/admin/configuracion/tienda": "Tienda",
      "/admin/configuracion/usuarios": "Usuarios",
    },
  },
  catalogo: {
    fallbackTitle: "Catálogo",
    sectionLabel: "Catálogo",
    sectionIcon: Package,
    items: [
      { href: "/admin/catalogo", label: "Inicio" },
      { href: "/admin/catalogo/categorias", label: "Categorías" },
      { href: "/admin/catalogo/productos", label: "Productos" },
      { href: "/admin/catalogo/nuevo-producto", label: "Nuevo producto" },
      { href: "/admin/catalogo/variantes", label: "Inventario" },
    ],
    titles: {
      "/admin/catalogo": "Catálogo",
      "/admin/catalogo/categorias": "Categorías",
      "/admin/catalogo/productos": "Productos",
      "/admin/catalogo/nuevo-producto": "Nuevo producto",
      "/admin/catalogo/variantes": "Inventario",
    },
    getTitle(pathname) {
      if (pathname.startsWith("/admin/catalogo/categorias/")) {
        return "Productos por categoría";
      }

      if (pathname.startsWith("/admin/catalogo/productos/")) {
        return "Detalle de producto";
      }

      if (pathname.startsWith("/admin/catalogo/variantes/")) {
        return "Detalle de inventario";
      }

      return this.titles[pathname] || this.fallbackTitle;
    },
  },
  ventas: {
    fallbackTitle: "Ventas",
    sectionLabel: "Ventas",
    sectionIcon: ReceiptText,
    items: [
      { href: "/admin/resumen", label: "Resumen" },
      { href: "/admin/clientes", label: "Clientes" },
      { href: "/admin/ventas", label: "Ventas directas" },
      { href: "/admin/ventas-online", label: "Ventas online" },
      { href: "/admin/pedidos", label: "Pedidos" },
    ],
    titles: {
      "/admin/resumen": "Resumen",
      "/admin/clientes": "Clientes",
      "/admin/clientes/nuevo": "Nuevo cliente",
      "/admin/ventas": "Ventas directas",
      "/admin/ventas-online": "Ventas online",
      "/admin/pedidos": "Pedidos a fábrica",
      "/admin/pedidos/nuevo": "Nuevo pedido a fábrica",
    },
    getTitle(pathname) {
      if (pathname.includes("/editar")) {
        return "Editar cliente";
      }

      if (pathname.includes("/direcciones/nueva")) {
        return "Nueva dirección";
      }

      if (pathname.startsWith("/admin/clientes/") && pathname !== "/admin/clientes/nuevo") {
        return "Detalle de cliente";
      }

      if (pathname === "/admin/ventas/nueva") {
        return "Nueva venta directa";
      }

      if (pathname.startsWith("/admin/ventas/")) {
        return "Detalle de venta directa";
      }

      if (pathname.startsWith("/admin/ventas-online/")) {
        return "Detalle de venta online";
      }

      if (pathname === "/admin/pedidos/nuevo") {
        return "Nuevo pedido a fábrica";
      }

      if (pathname.startsWith("/admin/pedidos/")) {
        return "Detalle de pedido";
      }

      return this.titles[pathname] || this.fallbackTitle;
    },
  },
};

export default function AdminModuleShell({ children, module = "configuracion", user }) {
  const [sidebarOpen, setSidebarOpen] = useState(null);
  const pathname = usePathname();
  const moduleConfig = moduleConfigs[module] || moduleConfigs.configuracion;
  const isSidebarOpen = sidebarOpen === true;
  const pageTitle = moduleConfig.getTitle
    ? moduleConfig.getTitle(pathname)
    : moduleConfig.titles[pathname] || moduleConfig.fallbackTitle;

  function closeSidebarOnMobile() {
    if (window.matchMedia("(max-width: 900px)").matches) {
      setSidebarOpen(false);
    }
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 900px)");

    function syncSidebarState() {
      setSidebarOpen(!mediaQuery.matches);
    }

    syncSidebarState();
    mediaQuery.addEventListener("change", syncSidebarState);

    return () => {
      mediaQuery.removeEventListener("change", syncSidebarState);
    };
  }, []);

  return (
    <div className={`admin-module__grid ${sidebarOpen === null ? "admin-module__grid--initializing" : ""} ${isSidebarOpen ? "admin-module__grid--sidebar-open" : "admin-module__grid--sidebar-hidden"}`}>
      <AdminSidebar
        activePathname={pathname}
        sections={[
          {
            icon: moduleConfig.sectionIcon,
            items: moduleConfig.items,
            label: moduleConfig.sectionLabel,
          },
        ]}
        user={user}
        isOpen={isSidebarOpen}
        onNavigate={closeSidebarOnMobile}
        onRequestClose={() => setSidebarOpen(false)}
      />

      <button
        type="button"
        className="admin-sidebar-toggle"
        aria-label="Mostrar menú"
        onClick={() => setSidebarOpen(true)}
      >
        <PanelLeftOpen size={20} strokeWidth={1.8} />
      </button>

      <div className="admin-workspace">
        <header className="admin-workspace__topbar">
          <h1 className="admin-workspace__title">{pageTitle}</h1>
          <button type="button" className="admin-workspace__notification" aria-label="Notificaciones">
            <Bell size={18} strokeWidth={1.8} />
          </button>
        </header>
        <main className="admin-workspace__content">{children}</main>
      </div>
    </div>
  );
}

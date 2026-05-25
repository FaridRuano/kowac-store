import { Grid2X2, PanelLeftClose } from "lucide-react";
import Link from "next/link";

import AdminLogoutIconButton from "@/components/auth/AdminLogoutIconButton";

export default function AdminSidebar({ activePathname, sections, user, isOpen, onNavigate, onRequestClose }) {
  return (
    <aside className={`admin-sidebar ${isOpen ? "admin-sidebar--open" : ""}`}>
      <div className="admin-sidebar__inner">
        <div className="admin-sidebar__header">
          <div>
            <Link href="/admin" className="admin-sidebar__brand" onClick={onNavigate}>
              KOWAC
            </Link>
            <p className="admin-sidebar__user">
              {user?.name || "Usuario"}
            </p>
          </div>

          <button
            type="button"
            className="admin-sidebar__close"
            aria-label="Ocultar menú"
            onClick={onRequestClose}
          >
            <PanelLeftClose size={18} strokeWidth={1.8} />
          </button>
        </div>

        <nav aria-label="Navegación administrativa" className="admin-sidebar__nav">
          {sections.map((section) => (
            <div key={section.label} className="admin-sidebar__section">
              {(() => {
                const SectionIcon = section.icon;

                return (
                  <>
                    <span className="admin-sidebar__section-label">
                      <SectionIcon size={13} strokeWidth={1.8} />
                      {section.label}
                    </span>
                    <div className="admin-sidebar__links">
                      {section.items.map((item) => {
                        const allowsNestedMatch = item.href !== "/admin/catalogo" && item.href !== "/admin/configuracion";
                        const isActive = activePathname === item.href || (allowsNestedMatch && activePathname.startsWith(`${item.href}/`));

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`admin-sidebar__link ${isActive ? "admin-sidebar__link--active" : ""}`}
                            aria-current={isActive ? "page" : undefined}
                            onClick={onNavigate}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar__actions" aria-label="Acciones administrativas">
          <Link href="/admin" className="admin-sidebar__action" aria-label="Cambiar de módulo" onClick={onNavigate}>
            <Grid2X2 size={18} strokeWidth={1.8} />
            <span>Cambiar de módulo</span>
          </Link>
          <AdminLogoutIconButton className="admin-sidebar__action admin-sidebar__action--danger" />
        </div>
      </div>
    </aside>
  );
}

export const metadata = {
  title: "Configuración | Admin Kowac",
};

export default function AdminConfigurationPage() {
  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Configuración</span>
          <h1>Ajustes generales</h1>
          <p className="text-muted">
            Este será el punto para administrar usuarios, permisos, datos de la empresa y preferencias globales.
          </p>
        </div>
      </div>
    </div>
  );
}

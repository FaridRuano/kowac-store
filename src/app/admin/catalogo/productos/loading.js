export default function AdminCatalogProductsLoading() {
  return (
    <div className="admin-page">
      <div className="admin-loading-card" aria-label="Cargando productos">
        <div className="admin-loading-card__header">
          <span className="admin-loading-card__pulse" aria-hidden="true" />
          <div className="admin-loading-card__copy">
            <span className="admin-loading-card__line admin-loading-card__line--eyebrow" />
            <span className="admin-loading-card__line admin-loading-card__line--title" />
            <span className="admin-loading-card__line admin-loading-card__line--body" />
          </div>
        </div>
        <div className="admin-loading-card__grid" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

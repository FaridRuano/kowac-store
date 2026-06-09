import ProductMediaManager from "@/components/admin/ProductMediaManager";

export default function ProductColorMediaManager({ colors = [], mediaGroups = [], productId, productName }) {
  if (!colors.length) {
    return (
      <section className="admin-product-media">
        <div className="admin-product-media__header">
          <div>
            <span className="eyebrow">Galerías</span>
            <h2>Imágenes por color</h2>
          </div>
        </div>
        <div className="admin-product-media__empty">
          <strong>No hay colores configurados.</strong>
          <span>Agrega al menos un color para crear su galería compartida por tallas.</span>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-color-media">
      <div className="admin-product-media__header">
        <div>
          <span className="eyebrow">Galerías</span>
          <h2>Imágenes por color</h2>
        </div>
        <span>{colors.length} color(es)</span>
      </div>

      <div className="admin-color-media__list">
        {colors.map((color) => {
          const mediaGroup = mediaGroups.find((group) =>
            group.optionKey === "color" && group.optionValue === color.value
          );
          const endpoint = `/api/products/${productId}/media?optionKey=color&optionValue=${encodeURIComponent(color.value)}&label=${encodeURIComponent(color.label)}`;

          return (
            <ProductMediaManager
              key={color.value}
              emptyDescription={`Sube imágenes para el color ${color.label}. Todas las tallas de este color compartirán esta galería.`}
              endpoint={endpoint}
              media={mediaGroup?.media || []}
              productName={`${productName} ${color.label}`}
              sectionId={`imagenes-${color.value}`}
              title={`Color ${color.label}`}
            />
          );
        })}
      </div>
    </section>
  );
}

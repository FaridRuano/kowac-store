import Link from "next/link";

import ProductGrid from "@/components/product/ProductGrid";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import Product from "@/models/Product";
import WishlistItem from "@/models/WishlistItem";

export const metadata = {
  title: "Wishlist | Kowac",
};

function getProductImage(product) {
  if (product.images?.[0]) {
    return product.images[0];
  }

  const media = (product.mediaGroups || [])
    .flatMap((group) => group.media || [])
    .filter((item) => item.type === "image" && (item.secureUrl || item.url))
    .sort((firstMedia, secondMedia) =>
      Number(secondMedia.isPrimary) - Number(firstMedia.isPrimary) ||
      Number(secondMedia.isFeatured) - Number(firstMedia.isFeatured) ||
      (firstMedia.sortOrder || 0) - (secondMedia.sortOrder || 0)
    )[0];

  return media?.secureUrl || media?.url || "";
}

async function getWishlistProducts(userId) {
  await connectDB();

  const items = await WishlistItem.find({ user: userId }).select("product createdAt").sort({ createdAt: -1 }).lean();
  const productIds = items.map((item) => item.product).filter(Boolean);

  if (!productIds.length) {
    return [];
  }

  const products = await Product.find({
    _id: { $in: productIds },
    isActive: true,
    showInCatalog: true,
    status: "active",
  })
    .select("name slug price compareAtPrice images mediaGroups type")
    .lean();
  const productById = new Map(products.map((product) => [product._id.toString(), product]));

  return items
    .map((item) => productById.get(item.product?.toString()))
    .filter(Boolean)
    .map((product) => ({
      _id: product._id.toString(),
      compareAtPrice: product.compareAtPrice || null,
      images: [getProductImage(product)].filter(Boolean),
      name: product.name,
      price: product.price,
      slug: product.slug,
      type: product.type,
    }));
}

export default async function WishlistPage() {
  const user = await getCurrentUser();
  const products = user ? await getWishlistProducts(user.id) : [];

  return (
    <section className="wishlist-page">
      <div className="wishlist-page__header">
        <div className="wishlist-heading">
          <span className="wishlist-heading__kicker">Wishlist</span>
          <h1>Favoritos</h1>
          <span className="wishlist-heading__count">
            {user ? `${products.length} producto(s) guardado(s)` : "Tu selección personal"}
          </span>
          <p>
            {user
              ? "Guarda las piezas que quieres volver a mirar y retómalas cuando estés listo para elegir."
              : "Inicia sesión para guardar productos y mantener tu selección disponible en cualquier visita."}
          </p>
          {!user ? (
            <Link href="/login?callbackUrl=/wishlist" className="wishlist-heading__action">
              Iniciar sesión
            </Link>
          ) : null}
        </div>
      </div>

      <div className="wishlist-page__content">
        {user ? <ProductGrid products={products} /> : null}
      </div>
    </section>
  );
}

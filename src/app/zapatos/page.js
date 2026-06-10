/* eslint-disable @next/next/no-img-element */
import ProductCategoryFilters from "@/components/product/ProductCategoryFilters";
import ProductGrid from "@/components/product/ProductGrid";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";
import ProductVariant from "@/models/ProductVariant";
import Link from "next/link";
import { unstable_cache } from "next/cache";

export const metadata = {
  title: "Zapatos | Kowac",
};

function normalizeSearchParams(searchParams = {}) {
  const rawSort = String(Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort || "newest").trim();

  return {
    color: String(Array.isArray(searchParams.color) ? searchParams.color[0] : searchParams.color || "").trim(),
    size: String(Array.isArray(searchParams.size) ? searchParams.size[0] : searchParams.size || "").trim(),
    sort: ["newest", "price-asc", "price-desc"].includes(rawSort) ? rawSort : "newest",
    subtype: String(Array.isArray(searchParams.subtype) ? searchParams.subtype[0] : searchParams.subtype || "").trim(),
  };
}

function slugifyFilterValue(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sortSizes(firstSize, secondSize) {
  const firstNumber = Number(firstSize.label);
  const secondNumber = Number(secondSize.label);

  if (Number.isFinite(firstNumber) && Number.isFinite(secondNumber)) {
    return firstNumber - secondNumber;
  }

  return firstSize.label.localeCompare(secondSize.label, "es");
}

function getColorValueFromVariant(variant) {
  if (variant.optionValues?.get) {
    return variant.optionValues.get("color") || "";
  }

  return variant.optionValues?.color || "";
}

function getProductColorImage(product, variant) {
  const colorValue = getColorValueFromVariant(variant);
  const mediaGroup = (product.mediaGroups || []).find((group) =>
    group.optionKey === "color" && group.optionValue === colorValue
  );
  const media = (mediaGroup?.media || [])
    .slice()
    .filter((item) => item.type === "image" && (item.secureUrl || item.url))
    .sort((firstMedia, secondMedia) =>
      Number(secondMedia.isPrimary) - Number(firstMedia.isPrimary) ||
      Number(secondMedia.isSecondary) - Number(firstMedia.isSecondary) ||
      Number(secondMedia.isFeatured) - Number(firstMedia.isFeatured) ||
      (firstMedia.sortOrder || 0) - (secondMedia.sortOrder || 0)
    )[0];

  return media?.secureUrl || media?.url || "";
}

function getFinalPrice(variant) {
  const price = variant.price || 0;

  if (!variant.discount?.isActive || variant.discount.type === "none" || !variant.discount.value) {
    return price;
  }

  if (variant.discount.type === "percent") {
    return Math.max(0, Number((price - (price * variant.discount.value) / 100).toFixed(2)));
  }

  return Math.max(0, Number((price - variant.discount.value).toFixed(2)));
}

function getSortQuery(sort) {
  if (sort === "price-asc") {
    return { price: 1, updatedAt: -1 };
  }

  if (sort === "price-desc") {
    return { price: -1, updatedAt: -1 };
  }

  return { isNewArrival: -1, updatedAt: -1 };
}

function getSpotlightProducts(products) {
  return products.filter((product) => product.isFeatured).slice(0, 5);
}

function getFallbackCategoryName(slug) {
  return String(slug || "")
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function getShoeCatalog(params) {
  await connectDB();

  const selectedCategory = params.subtype
    ? await Category.findOne({ isActive: true, slug: params.subtype, type: "zapatos" }).select("_id name slug").lean()
    : null;

  if (params.subtype && !selectedCategory) {
    return {
      categoryName: getFallbackCategoryName(params.subtype),
      colorOptions: [],
      products: [],
      sizeOptions: [],
    };
  }

  const baseVariantFilters = {
    ...(selectedCategory ? { category: selectedCategory._id } : {}),
    isActive: true,
    showInCatalog: true,
    status: "active",
  };
  const allVisibleVariants = await ProductVariant.find(baseVariantFilters)
    .select("product size colorName colorHex")
    .lean();
  const productIds = [...new Set(allVisibleVariants.map((variant) => variant.product?.toString()).filter(Boolean))];
  const products = productIds.length
    ? await Product.find({
        _id: { $in: productIds },
        isActive: true,
        showInCatalog: true,
        status: "active",
        type: "zapatos",
        ...(selectedCategory ? { category: selectedCategory._id } : {}),
      })
      .select("name slug brand category mediaGroups")
      .sort({ name: 1 })
      .lean()
    : [];
  const productById = new Map(products.map((product) => [product._id.toString(), product]));
  const activeProductIds = new Set(productById.keys());
  const activeVisibleVariants = allVisibleVariants.filter((variant) => activeProductIds.has(variant.product?.toString()));
  const sizeOptions = [...new Map(
    activeVisibleVariants
      .filter((variant) => variant.size)
      .map((variant) => [variant.size, { label: variant.size, value: variant.size }])
  ).values()].sort(sortSizes);
  const colorOptions = [...new Map(
    activeVisibleVariants
      .filter((variant) => variant.colorName)
      .map((variant) => [
        slugifyFilterValue(variant.colorName),
        {
          hex: variant.colorHex || "",
          label: variant.colorName,
          value: slugifyFilterValue(variant.colorName),
        },
      ])
  ).values()].sort((firstColor, secondColor) => firstColor.label.localeCompare(secondColor.label, "es"));
  const selectedColor = colorOptions.find((option) => option.value === params.color);
  const variantFilters = {
    ...baseVariantFilters,
    product: { $in: products.map((product) => product._id) },
    ...(params.size ? { size: params.size } : {}),
    ...(selectedColor ? { colorName: selectedColor.label } : {}),
  };

  const variants = products.length
    ? await ProductVariant.find(variantFilters)
    .select("product name price compareAtPrice discount optionValues isFeatured isNewArrival isTrending updatedAt")
    .sort(getSortQuery(params.sort))
    .lean()
    : [];
  const seenProducts = new Set();
  const catalogProducts = [];

  variants.forEach((variant) => {
    const product = productById.get(variant.product?.toString());

    if (!product || seenProducts.has(product._id.toString())) {
      return;
    }

    seenProducts.add(product._id.toString());
    catalogProducts.push({
      _id: product._id.toString(),
      brand: product.brand || "Kowac",
      compareAtPrice: variant.compareAtPrice || null,
      images: [getProductColorImage(product, variant)].filter(Boolean),
      isFeatured: Boolean(variant.isFeatured),
      isNewArrival: Boolean(variant.isNewArrival),
      isTrending: Boolean(variant.isTrending),
      name: product.name,
      price: getFinalPrice(variant),
      slug: product.slug,
      type: "zapatos",
    });
  });

  return {
    categoryName: selectedCategory?.name || "",
    colorOptions,
    products: catalogProducts,
    sizeOptions,
  };
}

const getCachedShoeCatalog = unstable_cache(
  async (params) => getShoeCatalog(params),
  ["shoe-catalog"],
  {
    revalidate: 300,
    tags: ["shoe-catalog"],
  }
);

export default async function ShoesPage({ searchParams }) {
  const params = normalizeSearchParams(await searchParams);
  const catalog = await getCachedShoeCatalog(params);
  const spotlightProducts = getSpotlightProducts(catalog.products);
  const title = catalog.categoryName || "Zapatos";

  return (
    <section className="catalog-page">
      <div className="catalog-page__header">
        <div className="catalog-heading">
          <span className="catalog-heading__kicker">Zapatos</span>
          <h1>{title}</h1>
          <span className="catalog-heading__count">{catalog.products.length} producto(s)</span>
          <p>
            Explora los modelos disponibles por talla y color, con los destacados de la categoría al inicio.
          </p>
        </div>

        {spotlightProducts.length ? (
          <div className="catalog-spotlight" aria-label="Productos destacados">
            {spotlightProducts.map((product) => (
              <Link key={product.slug} href={`/producto/${product.slug}`} className="catalog-spotlight-card">
                <div className="catalog-spotlight-card__media">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} />
                  ) : (
                    <div className="catalog-spotlight-card__placeholder">KOWAC</div>
                  )}
                  <span>Top</span>
                </div>
                <div className="catalog-spotlight-card__body">
                  <strong>{product.name}</strong>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="catalog-layout">
        <ProductCategoryFilters
          key={`${params.size}:${params.color}:${params.sort}:${params.subtype}`}
          colorOptions={catalog.colorOptions}
          currentColor={params.color}
          currentSize={params.size}
          currentSort={params.sort}
          label="zapatos"
          resultCount={catalog.products.length}
          sizeOptions={catalog.sizeOptions}
        />
        <div className="catalog-products">
          <ProductGrid products={catalog.products} />
        </div>
      </div>
    </section>
  );
}

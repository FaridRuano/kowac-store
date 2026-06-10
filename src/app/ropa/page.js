/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { unstable_cache } from "next/cache";

import ProductCategoryFilters from "@/components/product/ProductCategoryFilters";
import ProductGrid from "@/components/product/ProductGrid";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";
import ProductVariant from "@/models/ProductVariant";

export const metadata = {
  title: "Ropa | Kowac",
};

const fitLabels = {
  fit: "Fit",
  normal: "Normal",
  oversize: "Oversize",
};

function normalizeSearchParams(searchParams = {}) {
  const rawFit = String(Array.isArray(searchParams.fit) ? searchParams.fit[0] : searchParams.fit || "").trim();
  const rawSort = String(Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort || "newest").trim();

  return {
    color: String(Array.isArray(searchParams.color) ? searchParams.color[0] : searchParams.color || "").trim(),
    fit: Object.keys(fitLabels).includes(rawFit) ? rawFit : "",
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

async function getApparelCatalog(params) {
  await connectDB();

  const selectedCategory = params.subtype
    ? await Category.findOne({ isActive: true, slug: params.subtype, type: "ropa" }).select("_id name slug description").lean()
    : null;

  if (params.subtype && !selectedCategory) {
    return {
      categoryDescription: "",
      categoryName: getFallbackCategoryName(params.subtype),
      colorOptions: [],
      fitOptions: [],
      products: [],
      sizeOptions: [],
    };
  }

  const baseProductFilters = {
    isActive: true,
    showInCatalog: true,
    status: "active",
    type: "ropa",
    ...(selectedCategory ? { category: selectedCategory._id } : {}),
  };
  const baseProducts = await Product.find(baseProductFilters)
    .select("name slug brand category apparelFit mediaGroups isFeatured")
    .sort({ name: 1 })
    .lean();
  const fitOptions = [...new Map(
    baseProducts
      .filter((product) => product.apparelFit && fitLabels[product.apparelFit])
      .map((product) => [
        product.apparelFit,
        { label: fitLabels[product.apparelFit], value: product.apparelFit },
      ])
  ).values()];
  const products = params.fit
    ? baseProducts.filter((product) => product.apparelFit === params.fit)
    : baseProducts;
  const productIds = products.map((product) => product._id);
  const productById = new Map(products.map((product) => [product._id.toString(), product]));
  const baseVariantFilters = {
    isActive: true,
    product: { $in: productIds },
    showInCatalog: true,
    status: "active",
  };
  const allVisibleVariants = productIds.length
    ? await ProductVariant.find(baseVariantFilters)
      .select("product size colorName colorHex")
      .lean()
    : [];
  const sizeOptions = [...new Map(
    allVisibleVariants
      .filter((variant) => variant.size)
      .map((variant) => [variant.size, { label: variant.size, value: variant.size }])
  ).values()].sort(sortSizes);
  const colorOptions = [...new Map(
    allVisibleVariants
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
      isFeatured: Boolean(variant.isFeatured || product.isFeatured),
      isNewArrival: Boolean(variant.isNewArrival),
      isTrending: Boolean(variant.isTrending),
      name: product.name,
      price: getFinalPrice(variant),
      slug: product.slug,
      type: "ropa",
    });
  });

  return {
    categoryDescription: selectedCategory?.description || "",
    categoryName: selectedCategory?.name || "",
    colorOptions,
    fitOptions,
    products: catalogProducts,
    sizeOptions,
  };
}

const getCachedApparelCatalog = unstable_cache(
  async (params) => getApparelCatalog(params),
  ["apparel-catalog"],
  {
    revalidate: 300,
    tags: ["apparel-catalog"],
  }
);

export default async function ApparelPage({ searchParams }) {
  const params = normalizeSearchParams(await searchParams);
  const catalog = await getCachedApparelCatalog(params);
  const spotlightProducts = getSpotlightProducts(catalog.products);
  const title = catalog.categoryName || "Ropa";

  return (
    <section className="catalog-page">
      <div className="catalog-page__header">
        <div className="catalog-heading">
          <span className="catalog-heading__kicker">Ropa</span>
          <h1>{title}</h1>
          <span className="catalog-heading__count">{catalog.products.length} producto(s)</span>
          <p>
            {catalog.categoryDescription || "Explora prendas por talla, color y corte, con piezas destacadas de la colección al inicio."}
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
          key={`${params.size}:${params.color}:${params.fit}:${params.sort}:${params.subtype}`}
          colorOptions={catalog.colorOptions}
          currentColor={params.color}
          currentFit={params.fit}
          currentSize={params.size}
          currentSort={params.sort}
          fitOptions={catalog.fitOptions}
          label="ropa"
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

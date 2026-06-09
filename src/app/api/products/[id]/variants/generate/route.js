import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";

import { connectDB } from "@/lib/db";
import { getCurrentInternalUser } from "@/lib/session";
import Product from "@/models/Product";
import ProductVariant from "@/models/ProductVariant";

function buildLookup(id) {
  return isValidObjectId(id) ? { _id: id } : { slug: id };
}

function getOptionValues(product, key) {
  return product.options?.find((option) => option.key === key)?.values || [];
}

function buildVariantCombinations(product) {
  const sizes = getOptionValues(product, "size");
  const colors = getOptionValues(product, "color");

  if (!sizes.length && !colors.length) {
    return [];
  }

  const variantSizes = sizes.length ? sizes : [{ label: "", value: "sin-talla" }];
  const variantColors = colors.length ? colors : [{ hex: "", label: "", value: "sin-color" }];

  return variantSizes.flatMap((size) =>
    variantColors.map((color) => {
      const hasSize = size.value !== "sin-talla";
      const hasColor = color.value !== "sin-color";
      const name = [product.name, hasSize ? size.label : "", hasColor ? color.label : ""]
        .filter(Boolean)
        .join(" ");
      const optionSignature = [
        hasSize ? `size:${size.value}` : "size:base",
        hasColor ? `color:${color.value}` : "color:base",
      ].join("|");

      return {
        baseProductName: product.name,
        category: product.category || null,
        colorHex: hasColor ? color.hex || "" : "",
        colorName: hasColor ? color.label : "",
        cost: product.baseCost || 0,
        name,
        optionSignature,
        optionValues: {
          ...(hasSize ? { size: size.value } : {}),
          ...(hasColor ? { color: color.value } : {}),
        },
        price: product.basePrice || product.price || 0,
        product: product._id,
        showInCatalog: Boolean(product.showInCatalog),
        size: hasSize ? size.label : "",
        sku: buildSku(product.slug, size.value, color.value),
        status: product.status === "active" ? "active" : "draft",
      };
    })
  );
}

function buildSku(productSlug, sizeValue, colorValue) {
  return [productSlug, sizeValue, colorValue]
    .filter(Boolean)
    .join("-")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
}

export async function POST(_, context) {
  try {
    const user = await getCurrentInternalUser();

    if (!user) {
      return NextResponse.json({ message: "No autorizado." }, { status: 401 });
    }

    await connectDB();

    const { id } = await context.params;
    const product = await Product.findOne(buildLookup(id))
      .select("name slug category options baseCost basePrice price status showInCatalog")
      .lean();

    if (!product) {
      return NextResponse.json({ message: "Producto no encontrado." }, { status: 404 });
    }

    const combinations = buildVariantCombinations(product);

    if (!combinations.length) {
      return NextResponse.json(
        { message: "Agrega al menos una talla o un color antes de generar variantes." },
        { status: 400 }
      );
    }

    const signatures = combinations.map((combination) => combination.optionSignature);
    const existingVariants = await ProductVariant.find({
      product: product._id,
      optionSignature: { $in: signatures },
    })
      .select("optionSignature")
      .lean();
    const existingSignatures = new Set(existingVariants.map((variant) => variant.optionSignature));
    const newVariants = combinations.filter((combination) => !existingSignatures.has(combination.optionSignature));

    if (newVariants.length) {
      await ProductVariant.insertMany(newVariants, { ordered: false });
    }

    return NextResponse.json(
      {
        created: newVariants.length,
        skipped: combinations.length - newVariants.length,
        total: combinations.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/products/[id]/variants/generate error", error);

    if (error?.code === 11000) {
      return NextResponse.json(
        { message: "Algunas variantes ya existían. Actualiza la página e intenta de nuevo." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "No se pudieron generar las variantes." },
      { status: 500 }
    );
  }
}

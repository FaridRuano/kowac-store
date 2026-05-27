import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";

import { connectDB } from "@/lib/db";
import { createSlug } from "@/lib/slug";
import { productSchema } from "@/lib/validators";
import Category from "@/models/Category";
import Product from "@/models/Product";

function normalizeProductCategory(value) {
  return isValidObjectId(value) ? value : undefined;
}

function normalizeProductPricing(productData) {
  const basePrice = productData.basePrice || productData.price || 0;

  return {
    ...productData,
    basePrice,
    price: productData.price || basePrice,
  };
}

function buildDefaultSizeOption(type) {
  const defaultSizes = {
    ropa: ["XS", "S", "M", "L", "XL"],
    zapatos: ["35", "36", "37", "38", "39"],
  };
  const sizes = defaultSizes[type] || [];

  if (!sizes.length) {
    return null;
  }

  return {
    key: "size",
    label: "Talla",
    values: sizes.map((size) => ({
      label: size,
      value: size.toLowerCase(),
    })),
  };
}

function normalizeProductOptions(productData) {
  const hasSizeOption = productData.options?.some((option) => option.key === "size" && option.values?.length);
  const defaultSizeOption = buildDefaultSizeOption(productData.type);

  if (hasSizeOption || !defaultSizeOption) {
    return productData.options || [];
  }

  return [defaultSizeOption, ...(productData.options || [])];
}

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const gender = searchParams.get("gender");
    const q = searchParams.get("q");

    const filters = { isActive: true };

    if (category) {
      if (isValidObjectId(category)) {
        filters.category = category;
      } else {
        const categoryDoc = await Category.findOne({ slug: category, isActive: true }).select("_id");

        if (!categoryDoc) {
          return NextResponse.json([], { status: 200 });
        }

        filters.category = categoryDoc._id;
      }
    }

    if (type) {
      filters.type = type;
    }

    if (gender) {
      filters.gender = gender;
    }

    if (q) {
      const searchRegex = new RegExp(q, "i");
      filters.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { shortDescription: searchRegex },
        { tags: searchRegex },
      ];
    }

    const products = await Product.find(filters)
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error("GET /api/products error", error);
    return NextResponse.json(
      { message: "No se pudieron obtener los productos." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // TODO: proteger este endpoint con autenticación/roles del panel admin.
    await connectDB();

    const body = await request.json();
    const parsedData = productSchema.parse(body);
    const slug = parsedData.slug ? createSlug(parsedData.slug) : createSlug(parsedData.name);

    const product = await Product.create({
      ...normalizeProductPricing(parsedData),
      options: normalizeProductOptions(parsedData),
      slug,
      category: normalizeProductCategory(parsedData.category) || null,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error", error);

    if (error?.name === "ZodError") {
      return NextResponse.json(
        { message: "Datos de producto inválidos.", issues: error.issues },
        { status: 400 }
      );
    }

    if (error?.code === 11000) {
      return NextResponse.json(
        { message: "Ya existe un producto con ese slug o SKU." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "No se pudo crear el producto." },
      { status: 500 }
    );
  }
}

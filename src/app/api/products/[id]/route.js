import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";

import { connectDB } from "@/lib/db";
import { createSlug } from "@/lib/slug";
import { productUpdateSchema } from "@/lib/validators";
import Product from "@/models/Product";

function buildLookup(id) {
  return isValidObjectId(id) ? { _id: id } : { slug: id };
}

function normalizeProductPricing(productData) {
  if (!productData.basePrice && !productData.price) {
    return productData;
  }

  const basePrice = productData.basePrice || productData.price || 0;

  return {
    ...productData,
    basePrice,
    price: productData.price || basePrice,
  };
}

function normalizeProductCategory(value) {
  if (!value) {
    return null;
  }

  return isValidObjectId(value) ? value : undefined;
}

function normalizeProductPayload(productData) {
  const nextData = normalizeProductPricing(productData);

  if (Object.prototype.hasOwnProperty.call(nextData, "category")) {
    nextData.category = normalizeProductCategory(nextData.category) || null;
  }

  return nextData;
}

function pickSubmittedFields(parsedData, body) {
  return Object.keys(body).reduce((nextData, key) => {
    if (Object.prototype.hasOwnProperty.call(parsedData, key)) {
      nextData[key] = parsedData[key];
    }

    return nextData;
  }, {});
}

export async function GET(_, context) {
  try {
    await connectDB();

    const { id } = await context.params;
    const product = await Product.findOne(buildLookup(id)).populate("category", "name slug").lean();

    if (!product) {
      return NextResponse.json({ message: "Producto no encontrado." }, { status: 404 });
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("GET /api/products/[id] error", error);
    return NextResponse.json(
      { message: "No se pudo obtener el producto." },
      { status: 500 }
    );
  }
}

export async function PATCH(request, context) {
  try {
    await connectDB();

    const { id } = await context.params;
    const body = await request.json();
    const parsedData = productUpdateSchema.parse(body);
    const updateData = pickSubmittedFields(parsedData, body);

    if (updateData.slug) {
      updateData.slug = createSlug(updateData.slug);
    }

    if (updateData.name && !updateData.slug) {
      updateData.slug = createSlug(updateData.name);
    }

    const product = await Product.findOneAndUpdate(buildLookup(id), normalizeProductPayload(updateData), {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return NextResponse.json({ message: "Producto no encontrado." }, { status: 404 });
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/products/[id] error", error);

    if (error?.name === "ZodError") {
      return NextResponse.json(
        { message: "Datos de producto inválidos.", issues: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "No se pudo actualizar el producto." },
      { status: 500 }
    );
  }
}

export async function DELETE(_, context) {
  try {
    await connectDB();

    const { id } = await context.params;
    const product = await Product.findOneAndUpdate(
      buildLookup(id),
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return NextResponse.json({ message: "Producto no encontrado." }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Producto desactivado correctamente.", product },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/products/[id] error", error);
    return NextResponse.json(
      { message: "No se pudo eliminar el producto." },
      { status: 500 }
    );
  }
}

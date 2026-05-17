import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";

import { connectDB } from "@/lib/db";
import { createSlug } from "@/lib/slug";
import { productUpdateSchema } from "@/lib/validators";
import Product from "@/models/Product";

function buildLookup(id) {
  return isValidObjectId(id) ? { _id: id } : { slug: id };
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

    if (parsedData.slug) {
      parsedData.slug = createSlug(parsedData.slug);
    }

    if (parsedData.name && !parsedData.slug) {
      parsedData.slug = createSlug(parsedData.name);
    }

    const product = await Product.findOneAndUpdate(buildLookup(id), parsedData, {
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

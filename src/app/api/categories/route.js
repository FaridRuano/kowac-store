import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { createSlug } from "@/lib/slug";
import { categorySchema } from "@/lib/validators";
import Category from "@/models/Category";

export async function GET() {
  try {
    await connectDB();

    const categories = await Category.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error("GET /api/categories error", error);
    return NextResponse.json(
      { message: "No se pudieron obtener las categorías." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const parsedData = categorySchema.parse(body);
    const slug = parsedData.slug ? createSlug(parsedData.slug) : createSlug(parsedData.name);

    const category = await Category.create({
      ...parsedData,
      slug,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("POST /api/categories error", error);

    if (error?.name === "ZodError") {
      return NextResponse.json(
        { message: "Datos de categoría inválidos.", issues: error.issues },
        { status: 400 }
      );
    }

    if (error?.code === 11000) {
      return NextResponse.json(
        { message: "Ya existe una categoría con ese slug." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "No se pudo crear la categoría." },
      { status: 500 }
    );
  }
}

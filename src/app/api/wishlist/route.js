import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import Product from "@/models/Product";
import WishlistItem from "@/models/WishlistItem";

function isValidProductId(productId) {
  return mongoose.Types.ObjectId.isValid(productId);
}

async function getRequestedProductId(request) {
  const { searchParams } = new URL(request.url);
  const queryProductId = searchParams.get("productId");

  if (queryProductId) {
    return queryProductId;
  }

  try {
    const body = await request.json();

    return String(body?.productId || "");
  } catch (error) {
    return "";
  }
}

export async function GET(request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ productIds: [] }, { status: 200 });
  }

  await connectDB();

  const productId = new URL(request.url).searchParams.get("productId");

  if (productId) {
    if (!isValidProductId(productId)) {
      return NextResponse.json({ isFavorite: false }, { status: 200 });
    }

    const item = await WishlistItem.exists({ user: user.id, product: productId });

    return NextResponse.json({ isFavorite: Boolean(item) }, { status: 200 });
  }

  const items = await WishlistItem.find({ user: user.id }).select("product").lean();

  return NextResponse.json(
    { productIds: items.map((item) => item.product?.toString()).filter(Boolean) },
    { status: 200 }
  );
}

export async function POST(request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Inicia sesión para guardar favoritos." }, { status: 401 });
  }

  const productId = await getRequestedProductId(request);

  if (!isValidProductId(productId)) {
    return NextResponse.json({ message: "Producto inválido." }, { status: 400 });
  }

  await connectDB();

  const product = await Product.findOne({
    _id: productId,
    isActive: true,
    showInCatalog: true,
    status: "active",
  }).select("_id").lean();

  if (!product) {
    return NextResponse.json({ message: "Producto no disponible." }, { status: 404 });
  }

  await WishlistItem.updateOne(
    { user: user.id, product: productId },
    { $setOnInsert: { user: user.id, product: productId } },
    { upsert: true }
  );

  return NextResponse.json({ isFavorite: true }, { status: 200 });
}

export async function DELETE(request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Inicia sesión para modificar favoritos." }, { status: 401 });
  }

  const productId = await getRequestedProductId(request);

  if (!isValidProductId(productId)) {
    return NextResponse.json({ message: "Producto inválido." }, { status: 400 });
  }

  await connectDB();
  await WishlistItem.deleteOne({ user: user.id, product: productId });

  return NextResponse.json({ isFavorite: false }, { status: 200 });
}

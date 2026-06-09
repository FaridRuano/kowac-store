import { NextResponse } from "next/server";
import { isValidObjectId, Types } from "mongoose";

import { connectDB } from "@/lib/db";
import { getCurrentInternalUser } from "@/lib/session";
import ProductVariant from "@/models/ProductVariant";

const allowedFields = new Set([
  "stock",
  "reservedStock",
  "cost",
  "price",
  "compareAtPrice",
  "discount",
  "status",
  "showInCatalog",
  "isFeatured",
  "isNewArrival",
  "isTrending",
]);

function buildMongoLookup(id) {
  return isValidObjectId(id) ? { _id: new Types.ObjectId(id) } : { sku: id };
}

function normalizeVariantUpdate(body) {
  const updateData = {};

  for (const [key, value] of Object.entries(body)) {
    if (!allowedFields.has(key)) {
      continue;
    }

    updateData[key] = value;
  }

  for (const key of ["stock", "reservedStock"]) {
    if (Object.prototype.hasOwnProperty.call(updateData, key)) {
      updateData[key] = Math.max(0, Number.parseInt(updateData[key], 10) || 0);
    }
  }

  for (const key of ["cost", "price"]) {
    if (Object.prototype.hasOwnProperty.call(updateData, key)) {
      updateData[key] = Math.max(0, Number(Number(updateData[key] || 0).toFixed(2)));
    }
  }

  if (Object.prototype.hasOwnProperty.call(updateData, "compareAtPrice")) {
    updateData.compareAtPrice = updateData.compareAtPrice === "" || updateData.compareAtPrice === null
      ? null
      : Math.max(0, Number(Number(updateData.compareAtPrice || 0).toFixed(2)));
  }

  if (updateData.discount) {
    updateData.discount = {
      isActive: Boolean(updateData.discount.isActive),
      type: ["none", "percent", "fixed"].includes(updateData.discount.type) ? updateData.discount.type : "none",
      value: Math.max(0, Number(Number(updateData.discount.value || 0).toFixed(2))),
    };
  }

  if (updateData.status && !["draft", "active", "inactive"].includes(updateData.status)) {
    delete updateData.status;
  }

  if (Object.prototype.hasOwnProperty.call(updateData, "showInCatalog")) {
    updateData.showInCatalog = Boolean(updateData.showInCatalog);
  }

  if (Object.prototype.hasOwnProperty.call(updateData, "isFeatured")) {
    updateData.isFeatured = Boolean(updateData.isFeatured);
  }

  if (Object.prototype.hasOwnProperty.call(updateData, "isNewArrival")) {
    updateData.isNewArrival = Boolean(updateData.isNewArrival);
  }

  if (Object.prototype.hasOwnProperty.call(updateData, "isTrending")) {
    updateData.isTrending = Boolean(updateData.isTrending);
  }

  return updateData;
}

export async function PATCH(request, context) {
  try {
    const user = await getCurrentInternalUser();

    if (!user) {
      return NextResponse.json({ message: "No autorizado." }, { status: 401 });
    }

    await connectDB();

    const { id } = await context.params;
    const body = await request.json();
    const updateData = normalizeVariantUpdate(body);

    const variant = await ProductVariant.collection.findOneAndUpdate(buildMongoLookup(id), {
      $set: {
        ...updateData,
        updatedAt: new Date(),
      },
    }, {
      returnDocument: "after",
    });

    if (!variant) {
      return NextResponse.json({ message: "Variante no encontrada." }, { status: 404 });
    }

    return NextResponse.json(variant, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/variants/[id] error", error);
    return NextResponse.json(
      { message: "No se pudo actualizar la variante." },
      { status: 500 }
    );
  }
}

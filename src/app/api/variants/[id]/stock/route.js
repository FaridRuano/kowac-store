import { NextResponse } from "next/server";
import { isValidObjectId, Types } from "mongoose";

import { connectDB } from "@/lib/db";
import { getCurrentInternalUser } from "@/lib/session";
import ProductVariant from "@/models/ProductVariant";

function buildMongoLookup(id) {
  return isValidObjectId(id) ? { _id: new Types.ObjectId(id) } : { sku: id };
}

function normalizeStockAdjustment(body) {
  const type = body?.type === "out" ? "out" : "in";
  const quantity = Number.parseInt(body?.quantity, 10);

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return null;
  }

  return {
    note: String(body?.note || "").trim(),
    quantity,
    type,
  };
}

export async function POST(request, context) {
  try {
    const user = await getCurrentInternalUser();

    if (!user) {
      return NextResponse.json({ message: "No autorizado." }, { status: 401 });
    }

    await connectDB();

    const { id } = await context.params;
    const body = await request.json();
    const adjustment = normalizeStockAdjustment(body);

    if (!adjustment) {
      return NextResponse.json(
        { message: "Ingresa una cantidad válida." },
        { status: 400 }
      );
    }

    const baseLookup = buildMongoLookup(id);
    const lookup = adjustment.type === "out"
      ? { ...baseLookup, stock: { $gte: adjustment.quantity } }
      : baseLookup;
    const currentVariant = await ProductVariant.collection.findOne(baseLookup, {
      projection: { stock: 1 },
    });

    if (!currentVariant) {
      return NextResponse.json({ message: "Variante no encontrada." }, { status: 404 });
    }

    const stockDelta = adjustment.type === "in" ? adjustment.quantity : -adjustment.quantity;
    const createdAt = new Date();
    const variant = await ProductVariant.collection.findOneAndUpdate(lookup, [{
      $set: {
        stock: { $add: ["$stock", stockDelta] },
        stockMovements: {
          $concatArrays: [
            { $ifNull: ["$stockMovements", []] },
            [{
              createdAt,
              note: adjustment.note,
              quantity: adjustment.quantity,
              stockAfter: { $add: ["$stock", stockDelta] },
              type: adjustment.type,
            }],
          ],
        },
        updatedAt: createdAt,
      },
    }], {
      returnDocument: "after",
    });

    if (!variant) {
      return NextResponse.json(
        { message: "No puedes retirar más stock del disponible." },
        { status: 400 }
      );
    }

    return NextResponse.json(variant, { status: 200 });
  } catch (error) {
    console.error("POST /api/variants/[id]/stock error", error);
    return NextResponse.json(
      { message: "No se pudo ajustar el stock." },
      { status: 500 }
    );
  }
}

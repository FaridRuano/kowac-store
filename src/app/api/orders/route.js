import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { orderSchema } from "@/lib/validators";
import Order from "@/models/Order";

export async function GET() {
  try {
    await connectDB();

    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error("GET /api/orders error", error);
    return NextResponse.json(
      { message: "No se pudieron obtener los pedidos." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const parsedData = orderSchema.parse(body);
    const order = await Order.create(parsedData);

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("POST /api/orders error", error);

    if (error?.name === "ZodError") {
      return NextResponse.json(
        { message: "Datos del pedido inválidos.", issues: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "No se pudo crear el pedido." },
      { status: 500 }
    );
  }
}

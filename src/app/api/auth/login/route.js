import { NextResponse } from "next/server";

import { comparePassword, signAuthToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const email = body?.email?.trim()?.toLowerCase();
    const password = body?.password;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email y contraseña son obligatorios." },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email, isActive: true }).select("+password");

    if (!user) {
      return NextResponse.json(
        { message: "Credenciales inválidas." },
        { status: 401 }
      );
    }

    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { message: "Credenciales inválidas." },
        { status: 401 }
      );
    }

    const token = signAuthToken({
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    return NextResponse.json(
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/auth/login error", error);
    return NextResponse.json(
      { message: "No se pudo iniciar sesión." },
      { status: 500 }
    );
  }
}

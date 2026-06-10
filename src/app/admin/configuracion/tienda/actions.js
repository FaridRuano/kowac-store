"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { connectDB } from "@/lib/db";
import { createSlug } from "@/lib/slug";
import { getCurrentUser } from "@/lib/session";
import Category from "@/models/Category";

const allowedTypes = new Set(["zapatos", "ropa"]);

function getSettingsPath(type) {
  return `/admin/configuracion/tienda?tipo=${type === "ropa" ? "ropa" : "calzado"}`;
}

function revalidateStoreCategory(type) {
  revalidatePath("/admin/configuracion/tienda");
  revalidatePath(type === "zapatos" ? "/zapatos" : "/ropa");
  updateTag(type === "zapatos" ? "shoe-catalog" : "apparel-catalog");
}

async function requireInternalUser() {
  const user = await getCurrentUser();

  if (!user?.isInternal) {
    throw new Error("No autorizado.");
  }
}

export async function createStoreCategory(formData) {
  await requireInternalUser();
  await connectDB();

  const type = String(formData.get("type") || "");
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const rawSlug = String(formData.get("slug") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!allowedTypes.has(type)) {
    throw new Error("Tipo de categoría inválido.");
  }

  if (name.length < 2) {
    throw new Error("La categoría necesita un nombre.");
  }

  const slug = createSlug(rawSlug || name);

  if (!slug) {
    throw new Error("La categoría necesita un slug válido.");
  }

  if (id) {
    await Category.findOneAndUpdate(
      { _id: id, type },
      {
        $set: {
          name,
          slug,
          description,
          isActive: true,
        },
      },
      {
        runValidators: true,
      }
    );
  } else {
    await Category.findOneAndUpdate(
      { slug },
      {
        $set: {
          name,
          slug,
          description,
          type,
          isActive: true,
        },
      },
      {
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
        upsert: true,
      }
    );
  }

  revalidateStoreCategory(type);
  redirect(getSettingsPath(type));
}

export async function deleteStoreCategory(formData) {
  await requireInternalUser();
  await connectDB();

  const id = String(formData.get("id") || "");
  const type = String(formData.get("type") || "");

  if (!allowedTypes.has(type) || !id) {
    throw new Error("Categoría inválida.");
  }

  await Category.findOneAndUpdate(
    { _id: id, type },
    { $set: { isActive: false } },
    { runValidators: true }
  );

  revalidateStoreCategory(type);
}

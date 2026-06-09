"use server";

import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import Customer from "@/models/Customer";

const customerAddressSchema = z.object({
  addressLine: z.string().trim().min(1),
  city: z.string().trim().min(1),
  country: z.string().trim().default("Ecuador"),
  province: z.string().trim().min(1),
  reference: z.string().trim().optional().or(z.literal("")),
});

async function requireInternalUser() {
  const user = await getCurrentUser();

  if (!user?.isInternal) {
    throw new Error("No autorizado.");
  }
}

function getString(formData, key) {
  return String(formData.get(key) || "").trim();
}

export async function addCustomerAddress(customerId, formData) {
  await requireInternalUser();

  if (!isValidObjectId(customerId)) {
    throw new Error("Cliente inválido.");
  }

  const parsedAddress = customerAddressSchema.safeParse({
    addressLine: getString(formData, "addressLine"),
    city: getString(formData, "city"),
    country: getString(formData, "country") || "Ecuador",
    province: getString(formData, "province"),
    reference: getString(formData, "reference"),
  });

  if (!parsedAddress.success) {
    throw new Error("Completa la provincia, ciudad y dirección antes de guardar.");
  }

  await connectDB();

  const customer = await Customer.findById(customerId).select("addresses");

  if (!customer) {
    throw new Error("Cliente no encontrado.");
  }

  customer.addresses.push({
    ...parsedAddress.data,
    isDefault: !(customer.addresses?.length || 0),
  });

  await customer.save();

  revalidatePath("/admin/clientes");
  revalidatePath(`/admin/clientes/${customerId}`);
  redirect(`/admin/clientes/${customerId}`);
}

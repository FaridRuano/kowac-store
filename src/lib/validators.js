import { z } from "zod";

const objectIdSchema = z.string().min(1);

export const productVariantSchema = z.object({
  sku: z.string().trim().min(1),
  colorName: z.string().trim().min(1),
  colorHex: z.string().trim().optional().or(z.literal("")),
  size: z.string().trim().min(1),
  stock: z.coerce.number().int().min(0).default(0),
  price: z.coerce.number().min(0),
  images: z.array(z.string().trim()).default([]),
  isActive: z.boolean().default(true),
});

export const productSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().optional(),
  description: z.string().trim().default(""),
  shortDescription: z.string().trim().default(""),
  brand: z.string().trim().default("Kowac"),
  category: objectIdSchema.optional().or(z.literal("")),
  gender: z.enum(["hombre", "mujer", "unisex", "niños"]),
  type: z.enum(["zapatos", "ropa", "accesorios"]),
  price: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().min(0).optional().nullable(),
  images: z.array(z.string().trim()).default([]),
  tags: z.array(z.string().trim()).default([]),
  variants: z.array(productVariantSchema).default([]),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const productUpdateSchema = productSchema.partial();

export const categorySchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().optional(),
  description: z.string().trim().default(""),
  image: z.string().trim().default(""),
  isActive: z.boolean().default(true),
});

const addressSchema = z.object({
  province: z.string().trim().min(1),
  city: z.string().trim().min(1),
  addressLine: z.string().trim().min(1),
  reference: z.string().trim().optional().or(z.literal("")),
  isDefault: z.boolean().default(false),
});

export const orderSchema = z.object({
  orderNumber: z.string().trim().optional(),
  customer: z.object({
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
    email: z.email(),
    phone: z.string().trim().optional().or(z.literal("")),
  }),
  items: z.array(
    z.object({
      productId: objectIdSchema.optional().or(z.literal("")),
      productName: z.string().trim().min(1),
      slug: z.string().trim().min(1),
      image: z.string().trim().optional().or(z.literal("")),
      sku: z.string().trim().min(1),
      colorName: z.string().trim().min(1),
      size: z.string().trim().min(1),
      quantity: z.coerce.number().int().min(1),
      unitPrice: z.coerce.number().min(0),
      total: z.coerce.number().min(0),
    })
  ).min(1),
  subtotal: z.coerce.number().min(0),
  shippingCost: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  total: z.coerce.number().min(0),
  paymentMethod: z.enum(["transferencia", "payphone", "stripe", "manual"]),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).default("pending"),
  orderStatus: z.enum(["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"]).default("pending"),
  shippingAddress: addressSchema,
  shipment: z.object({
    courier: z.string().trim().optional().or(z.literal("")),
    trackingNumber: z.string().trim().optional().or(z.literal("")),
    trackingUrl: z.string().trim().optional().or(z.literal("")),
  }).default({}),
  notes: z.string().trim().optional().or(z.literal("")),
});

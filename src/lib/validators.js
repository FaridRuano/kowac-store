import { z } from "zod";

const objectIdSchema = z.string().min(1);

const productMediaSchema = z.object({
  provider: z.enum(["vercel_blob", "r2", "cloudinary", "mux", "external"]).default("external"),
  type: z.enum(["image", "video"]).default("image"),
  url: z.string().trim().default(""),
  secureUrl: z.string().trim().default(""),
  storageKey: z.string().trim().default(""),
  publicId: z.string().trim().default(""),
  assetId: z.string().trim().default(""),
  playbackId: z.string().trim().default(""),
  alt: z.string().trim().default(""),
  width: z.coerce.number().min(0).optional().nullable(),
  height: z.coerce.number().min(0).optional().nullable(),
  duration: z.coerce.number().min(0).optional().nullable(),
  format: z.string().trim().default(""),
  bytes: z.coerce.number().min(0).optional().nullable(),
  sortOrder: z.coerce.number().default(0),
  isPrimary: z.boolean().default(false),
  isSecondary: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  status: z.enum(["pending", "ready", "errored"]).default("ready"),
});

const productOptionValueSchema = z.object({
  label: z.string().trim().min(1),
  value: z.string().trim().min(1),
  hex: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional().or(z.literal("")),
});

const productOptionSchema = z.object({
  key: z.string().trim().min(1),
  label: z.string().trim().min(1),
  values: z.array(productOptionValueSchema).default([]),
});

const productDiscountSchema = z.object({
  type: z.enum(["inherit", "none", "percent", "fixed"]).default("none"),
  value: z.coerce.number().min(0).default(0),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  isActive: z.boolean().default(false),
});

const productMediaGroupSchema = z.object({
  optionKey: z.string().trim().min(1),
  optionValue: z.string().trim().min(1),
  label: z.string().trim().default(""),
  media: z.array(productMediaSchema).default([]),
});

export const productVariantSchema = z.object({
  sku: z.string().trim().min(1),
  optionValues: z.record(z.string(), z.string()).default({}),
  colorName: z.string().trim().optional().or(z.literal("")),
  colorHex: z.string().trim().optional().or(z.literal("")),
  size: z.string().trim().optional().or(z.literal("")),
  costOverride: z.coerce.number().min(0).optional().nullable(),
  priceOverride: z.coerce.number().min(0).optional().nullable(),
  compareAtPriceOverride: z.coerce.number().min(0).optional().nullable(),
  discount: productDiscountSchema.default({ type: "inherit" }),
  media: z.array(productMediaSchema).default([]),
  showInCatalog: z.boolean().default(true),
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
  type: z.enum(["zapatos", "ropa"]),
  apparelFit: z.enum(["", "normal", "oversize", "fit"]).default(""),
  status: z.enum(["draft", "active", "inactive"]).default("draft"),
  baseCost: z.coerce.number().min(0).default(0),
  basePrice: z.coerce.number().min(0).default(0),
  price: z.coerce.number().min(0).default(0),
  compareAtPrice: z.coerce.number().min(0).optional().nullable(),
  images: z.array(z.string().trim()).default([]),
  options: z.array(productOptionSchema).default([]),
  mediaGroups: z.array(productMediaGroupSchema).default([]),
  productDiscount: productDiscountSchema.default({ type: "none" }),
  tags: z.array(z.string().trim()).default([]),
  variants: z.array(productVariantSchema).default([]),
  isFeatured: z.boolean().default(false),
  showInCatalog: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const productUpdateSchema = productSchema.partial();

export const categorySchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().optional(),
  description: z.string().trim().default(""),
  image: z.string().trim().default(""),
  type: z.enum(["zapatos", "ropa"]),
  isActive: z.boolean().default(true),
});

const addressSchema = z.object({
  country: z.string().trim().default("Ecuador"),
  province: z.string().trim().min(1),
  city: z.string().trim().min(1),
  addressLine: z.string().trim().min(1),
  reference: z.string().trim().optional().or(z.literal("")),
  isDefault: z.boolean().default(false),
});

export const customerSchema = z.object({
  billingMode: z.enum(["consumer_final", "tax_data"]).default("consumer_final"),
  customerType: z.enum(["national", "foreign"]).default("national"),
  documentType: z.enum(["", "cedula", "ruc", "passport", "foreign_id"]).default(""),
  documentNumber: z.string().trim().default(""),
  taxName: z.string().trim().default(""),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.email(),
  phone: z.string().trim().min(1),
  addresses: z.array(addressSchema).default([]),
  billingAddress: addressSchema.nullable().default(null),
}).superRefine((data, context) => {
  if (data.billingMode === "consumer_final") {
    return;
  }

  if (!data.taxName || data.taxName.length < 2) {
    context.addIssue({
      code: "custom",
      message: "El nombre para factura es obligatorio.",
      path: ["taxName"],
    });
  }

  if (!data.documentNumber || data.documentNumber.length < 3) {
    context.addIssue({
      code: "custom",
      message: "El número de documento es obligatorio.",
      path: ["documentNumber"],
    });
  }

  if (!data.billingAddress) {
    context.addIssue({
      code: "custom",
      message: "La dirección fiscal es obligatoria.",
      path: ["billingAddress"],
    });
  }

  if (data.customerType === "national" && !["cedula", "ruc"].includes(data.documentType)) {
    context.addIssue({
      code: "custom",
      message: "Selecciona cédula o RUC para clientes nacionales.",
      path: ["documentType"],
    });
  }

  if (data.customerType === "foreign" && !["passport", "foreign_id"].includes(data.documentType)) {
    context.addIssue({
      code: "custom",
      message: "Selecciona identificación del exterior para clientes extranjeros.",
      path: ["documentType"],
    });
  }

  if (data.documentType === "cedula" && !/^\d{10}$/.test(data.documentNumber)) {
    context.addIssue({
      code: "custom",
      message: "La cédula debe tener 10 dígitos.",
      path: ["documentNumber"],
    });
  }

  if (data.documentType === "ruc" && !/^\d{13}$/.test(data.documentNumber)) {
    context.addIssue({
      code: "custom",
      message: "El RUC debe tener 13 dígitos.",
      path: ["documentNumber"],
    });
  }
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

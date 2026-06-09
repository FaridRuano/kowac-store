"use server";

import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import Customer from "@/models/Customer";
import Order from "@/models/Order";
import ProductVariant from "@/models/ProductVariant";

const orderInitialState = {
  errors: {},
  message: "",
  status: "idle",
};

const DEFAULT_TAX_RATE = 15;
async function requireInternalUser() {
  const user = await getCurrentUser();

  if (!user?.isInternal) {
    throw new Error("No autorizado.");
  }
}

function getString(formData, key) {
  return String(formData.get(key) || "").trim();
}

function getNumber(formData, key) {
  const value = Number.parseFloat(String(formData.get(key) || "0"));

  return Number.isFinite(value) && value > 0 ? value : 0;
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normalizeDocumentNumber(value) {
  return value.replace(/\s+/g, "").toUpperCase();
}

function parseItems(value) {
  try {
    const parsed = JSON.parse(value || "[]");

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => ({
        productionNote: getSafeItemNote(item.productionNote),
        quantity: Number.parseInt(String(item.quantity || "1"), 10),
        variantId: String(item.variantId || "").trim(),
      }))
      .filter((item) => isValidObjectId(item.variantId) && Number.isInteger(item.quantity) && item.quantity > 0);
  } catch {
    return [];
  }
}

function getSafeItemNote(value) {
  return String(value || "").trim().slice(0, 600);
}

function buildCustomerSnapshot(customer) {
  return {
    customerId: customer._id,
    documentNumber: customer.documentNumber || "",
    documentType: customer.documentType || "",
    email: customer.email || "",
    firstName: customer.firstName || "",
    lastName: customer.lastName || "",
    phone: customer.phone || "",
    taxName: customer.taxName || "",
  };
}

function buildShippingAddress(formData) {
  return {
    addressLine: getString(formData, "shippingAddressLine"),
    city: getString(formData, "shippingCity"),
    country: "Ecuador",
    isDefault: false,
    postalCode: getString(formData, "shippingPostalCode"),
    province: getString(formData, "shippingProvince"),
    reference: getString(formData, "shippingReference"),
  };
}

function buildShippingRecipient(formData) {
  const enabled = formData.get("shippingRecipientEnabled") === "on";

  return {
    documentNumber: enabled ? normalizeDocumentNumber(getString(formData, "shippingRecipientDocumentNumber")) : "",
    enabled,
    fullName: enabled ? getString(formData, "shippingRecipientName") : "",
  };
}

function getPrimaryImage(variant) {
  const media = Array.isArray(variant.media) ? variant.media : [];
  const image = media.find((item) => item.isPrimary) || media[0];

  return image?.secureUrl || image?.url || "";
}

export async function quickCreateOrderCustomer(prevState = orderInitialState, formData) {
  void prevState;

  await requireInternalUser();

  const firstName = getString(formData, "firstName");
  const lastName = getString(formData, "lastName");
  const email = getString(formData, "email").toLowerCase();
  const phone = getString(formData, "phone");
  const documentType = getString(formData, "documentType");
  const documentNumber = normalizeDocumentNumber(getString(formData, "documentNumber"));
  const taxName = getString(formData, "taxName");
  const billingAddress = {
    addressLine: getString(formData, "billingAddressLine"),
    city: getString(formData, "billingCity"),
    country: getString(formData, "billingCountry") || "Ecuador",
    isDefault: false,
    province: getString(formData, "billingProvince"),
  };
  const hasBillingAddress = Boolean(billingAddress.province && billingAddress.city && billingAddress.addressLine);
  const hasDocument = Boolean(documentType && documentNumber);

  if (!firstName || !lastName || !email || !phone) {
    return {
      errors: {},
      message: "Completa nombre, correo y teléfono para crear el cliente.",
      status: "error",
    };
  }

  if ((documentType && !documentNumber) || (!documentType && documentNumber)) {
    return {
      errors: {},
      message: "Completa tipo y número de documento, o deja ambos vacíos.",
      status: "error",
    };
  }

  await connectDB();

  const duplicateConditions = [{ email }];

  if (hasDocument) {
    duplicateConditions.push({
      documentNumber,
      documentType,
    });
  }

  const duplicateCustomer = await Customer.findOne({ $or: duplicateConditions }).select("_id").lean();

  if (duplicateCustomer) {
    return {
      errors: {},
      message: "Ya existe un cliente con ese correo o documento.",
      status: "error",
    };
  }

  const customer = await Customer.create({
    addresses: [],
    billingAddress: hasBillingAddress ? billingAddress : null,
    billingMode: hasDocument || taxName || hasBillingAddress ? "tax_data" : "consumer_final",
    customerType: "national",
    documentNumber: hasDocument ? documentNumber : "",
    documentType: hasDocument ? documentType : "",
    email,
    firstName,
    lastName,
    phone,
    taxName: taxName || `${firstName} ${lastName}`.trim(),
  });

  revalidatePath("/admin/clientes");
  revalidatePath("/admin/pedidos/nuevo");

  return {
    customer: {
      addresses: [],
      documentNumber: customer.documentNumber || "",
      documentType: customer.documentType || "",
      email: customer.email,
      firstName: customer.firstName,
      fullName: `${customer.firstName} ${customer.lastName}`.trim(),
      id: customer._id.toString(),
      lastName: customer.lastName,
      phone: customer.phone,
      taxName: customer.taxName || "",
    },
    errors: {},
    message: "Cliente creado y seleccionado para el pedido.",
    status: "success",
  };
}

export async function createOrder(prevState = orderInitialState, formData) {
  void prevState;

  await requireInternalUser();

  const customerId = getString(formData, "customerId");
  const deliveryMethod = getString(formData, "deliveryMethod") === "pickup" ? "pickup" : "shipping";
  const rawItems = parseItems(getString(formData, "items"));
  const discountType = getString(formData, "discountType");
  const discountValue = getNumber(formData, "discountValue");
  const shippingCost = deliveryMethod === "shipping" ? getNumber(formData, "shippingCost") : 0;
  const invoiceRequired = formData.get("invoiceRequired") === "on";
  const taxEnabled = invoiceRequired;
  const taxRate = invoiceRequired ? DEFAULT_TAX_RATE : 0;
  const paymentMethod = getString(formData, "paymentMethod");
  const paymentStatus = getString(formData, "paymentStatus");
  const paymentDepositAmount = paymentStatus === "partial" ? getNumber(formData, "paymentDepositAmount") : 0;
  const orderStatus = getString(formData, "orderStatus");
  const notes = getString(formData, "notes");
  const shippingAddress = deliveryMethod === "shipping" ? buildShippingAddress(formData) : null;
  const shippingRecipient = deliveryMethod === "shipping" ? buildShippingRecipient(formData) : { documentNumber: "", enabled: false, fullName: "" };

  if (!isValidObjectId(customerId)) {
    return {
      errors: {},
      message: "Selecciona un cliente para crear el pedido.",
      status: "error",
    };
  }

  if (!rawItems.length) {
    return {
      errors: {},
      message: "Agrega al menos un producto al pedido.",
      status: "error",
    };
  }

  if (!["transferencia", "payphone", "datafast", "stripe", "manual"].includes(paymentMethod)) {
    return {
      errors: {},
      message: "Selecciona un método de pago válido.",
      status: "error",
    };
  }

  if (!["pending", "partial", "paid", "failed", "refunded"].includes(paymentStatus)) {
    return {
      errors: {},
      message: "Selecciona un estado de pago válido.",
      status: "error",
    };
  }

  if (!["pending", "confirmed", "preparing"].includes(orderStatus)) {
    return {
      errors: {},
      message: "Selecciona un estado inicial válido.",
      status: "error",
    };
  }

  if (deliveryMethod === "shipping" && (!shippingAddress.province || !shippingAddress.city || !shippingAddress.addressLine)) {
    return {
      errors: {},
      message: "Completa la dirección de envío o cambia el pedido a retiro en local.",
      status: "error",
    };
  }

  if (shippingRecipient.enabled && (!shippingRecipient.fullName || !shippingRecipient.documentNumber)) {
    return {
      errors: {},
      message: "Completa nombre e identificación de la persona que recibe.",
      status: "error",
    };
  }

  await connectDB();

  const customer = await Customer.findOne({ _id: customerId, isActive: { $ne: false } }).lean();

  if (!customer) {
    return {
      errors: {},
      message: "No encontramos el cliente seleccionado.",
      status: "error",
    };
  }

  if (!customer.email || !customer.phone) {
    return {
      errors: {},
      message: "El cliente necesita correo y teléfono antes de crear un pedido.",
      status: "error",
    };
  }

  const variants = await ProductVariant.find({
    _id: { $in: rawItems.map((item) => item.variantId) },
    isActive: true,
  })
    .lean();
  const variantsById = new Map(variants.map((variant) => [variant._id.toString(), variant]));
  const items = [];

  for (const rawItem of rawItems) {
    const variant = variantsById.get(rawItem.variantId);

    if (!variant) {
      return {
        errors: {},
        message: "Uno de los productos seleccionados ya no está disponible.",
        status: "error",
      };
    }

    const unitPrice = roundMoney(variant.price || 0);
    const lineTotal = roundMoney(unitPrice * rawItem.quantity);

    items.push({
      colorName: variant.colorName || "",
      image: getPrimaryImage(variant),
      productId: variant.product || null,
      productName: variant.baseProductName || variant.name,
      quantity: rawItem.quantity,
      productionNote: rawItem.productionNote,
      size: variant.size || "",
      sku: variant.sku,
      slug: variant.sku,
      total: lineTotal,
      unitPrice,
    });
  }

  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.total, 0));
  const rawDiscount = discountType === "percent" ? subtotal * (discountValue / 100) : discountValue;
  const discount = roundMoney(Math.min(Math.max(rawDiscount, 0), subtotal));
  const taxableBase = roundMoney(Math.max(subtotal - discount, 0));
  const taxAmount = taxEnabled ? roundMoney(taxableBase * (taxRate / 100)) : 0;
  const total = roundMoney(taxableBase + taxAmount + shippingCost);

  if (paymentStatus === "partial" && paymentDepositAmount <= 0) {
    return {
      errors: {},
      message: "Ingresa el valor abonado.",
      status: "error",
    };
  }

  if (paymentStatus === "partial" && paymentDepositAmount >= total) {
    return {
      errors: {},
      message: "El abono debe ser menor al total del pedido.",
      status: "error",
    };
  }

  const order = await Order.create({
    customer: buildCustomerSnapshot(customer),
    deliveryMethod,
    discount,
    invoiceRequired,
    invoiceStatus: invoiceRequired ? "pending" : "not_required",
    items,
    notes,
    orderStatus,
    orderType: "production_order",
    paymentMethod,
    paymentDepositAmount,
    paymentStatus,
    shippingAddress,
    shippingCost,
    shippingRecipient,
    subtotal,
    taxAmount,
    taxEnabled,
    taxRate,
    total,
  });

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/ventas-online");
  redirect(`/admin/pedidos/${order._id.toString()}`);
}

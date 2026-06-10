"use server";

import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { connectDB } from "@/lib/db";
import { renderKowacEmail, sendEmail } from "@/lib/email";
import { getEmailSender } from "@/lib/email-senders";
import { getCurrentUser } from "@/lib/session";
import Customer from "@/models/Customer";
import ProductVariant from "@/models/ProductVariant";
import Sale from "@/models/Sale";

const saleInitialState = {
  errors: {},
  message: "",
  status: "idle",
};

const DEFAULT_TAX_RATE = 15;
const INVOICE_STATUSES = ["not_required", "pending", "issued", "cancelled"];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function normalizeDocumentNumber(value) {
  return value.replace(/\s+/g, "").toUpperCase();
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatPlainTextAsHtml(value) {
  return escapeHtml(value)
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function parseItems(value) {
  try {
    const parsed = JSON.parse(value || "[]");

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => ({
        quantity: Number.parseInt(String(item.quantity || "1"), 10),
        variantId: String(item.variantId || "").trim(),
      }))
      .filter((item) => isValidObjectId(item.variantId) && Number.isInteger(item.quantity) && item.quantity > 0);
  } catch {
    return [];
  }
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

export async function quickCreateSaleCustomer(prevState = saleInitialState, formData) {
  void prevState;

  await requireInternalUser();

  const documentType = getString(formData, "documentType");
  const documentNumber = normalizeDocumentNumber(getString(formData, "documentNumber"));
  const firstName = getString(formData, "firstName");
  const lastName = getString(formData, "lastName");
  const email = getString(formData, "email").toLowerCase();
  const phone = getString(formData, "phone");
  const taxName = getString(formData, "taxName") || `${firstName} ${lastName}`.trim();
  const billingAddress = {
    addressLine: getString(formData, "billingAddressLine"),
    city: getString(formData, "billingCity"),
    country: getString(formData, "billingCountry") || "Ecuador",
    isDefault: false,
    province: getString(formData, "billingProvince"),
  };

  if (!firstName || !lastName || !email || !phone || !taxName || !documentType || !documentNumber) {
    return {
      errors: {},
      message: "Completa contacto y documento antes de crear el cliente.",
      status: "error",
    };
  }

  if (!billingAddress.province || !billingAddress.city || !billingAddress.addressLine) {
    return {
      errors: {},
      message: "Completa la dirección fiscal del cliente.",
      status: "error",
    };
  }

  await connectDB();

  const duplicateCustomer = await Customer.findOne({
    $or: [
      { email },
      {
        documentNumber,
        documentType,
      },
    ],
  }).select("_id").lean();

  if (duplicateCustomer) {
    return {
      errors: {},
      message: "Ya existe un cliente con ese correo o documento.",
      status: "error",
    };
  }

  const customer = await Customer.create({
    addresses: [],
    billingAddress,
    billingMode: "tax_data",
    customerType: "national",
    documentNumber,
    documentType,
    email,
    firstName,
    lastName,
    phone,
    taxName,
  });

  revalidatePath("/admin/clientes");

  return {
    customer: {
      documentNumber: customer.documentNumber,
      documentType: customer.documentType,
      email: customer.email,
      firstName: customer.firstName,
      fullName: `${customer.firstName} ${customer.lastName}`.trim(),
      id: customer._id.toString(),
      lastName: customer.lastName,
      phone: customer.phone,
      taxName: customer.taxName,
    },
    errors: {},
    message: "Cliente creado y seleccionado para la venta.",
    status: "success",
  };
}

export async function sendSalesEmail(prevState = saleInitialState, formData) {
  void prevState;

  await requireInternalUser();

  const from = getString(formData, "from").toLowerCase();
  const to = getString(formData, "to").toLowerCase();
  const subject = getString(formData, "subject");
  const message = getString(formData, "message");
  const sender = getEmailSender(from);
  const errors = {};

  if (!sender) {
    errors.from = ["Selecciona una dirección de Kowac válida."];
  }

  if (!emailRegex.test(to)) {
    errors.to = ["Ingresa un correo válido."];
  }

  if (subject.length < 3) {
    errors.subject = ["El asunto debe tener al menos 3 caracteres."];
  }

  if (message.length < 8) {
    errors.message = ["El mensaje debe tener al menos 8 caracteres."];
  }

  if (Object.keys(errors).length) {
    return {
      errors,
      message: "Revisa los campos antes de enviar.",
      status: "error",
    };
  }

  try {
    const html = renderKowacEmail({
      title: subject,
      previewText: message.slice(0, 140),
      children: `
        <h1>${escapeHtml(subject)}</h1>
        ${formatPlainTextAsHtml(message)}
      `,
    });

    await sendEmail({
      from: `${sender.name} <${sender.email}>`,
      html,
      replyTo: sender.email,
      subject,
      text: message,
      to,
    });

    return {
      errors: {},
      message: `Correo enviado a ${to}.`,
      status: "success",
    };
  } catch (error) {
    console.error("sendSalesEmail error", error);

    return {
      errors: {},
      message: "No se pudo enviar el correo. Revisa las variables SMTP o la contraseña de aplicación.",
      status: "error",
    };
  }
}

export async function createSale(prevState = saleInitialState, formData) {
  void prevState;

  await requireInternalUser();

  const customerMode = getString(formData, "customerMode") === "registered" ? "registered" : "consumer_final";
  const customerId = getString(formData, "customerId");
  const rawItems = parseItems(getString(formData, "items"));
  const paymentMethod = getString(formData, "paymentMethod");
  const discountType = getString(formData, "discountType");
  const discountValue = getNumber(formData, "discountValue");
  const invoiceRequired = formData.get("invoiceRequired") === "on";
  const taxEnabled = invoiceRequired;
  const taxRate = invoiceRequired ? DEFAULT_TAX_RATE : 0;
  const notes = getString(formData, "notes");

  if (!["cash", "card", "transfer", "mixed"].includes(paymentMethod)) {
    return {
      errors: {},
      message: "Selecciona un método de pago válido.",
      status: "error",
    };
  }

  if (!rawItems.length) {
    return {
      errors: {},
      message: "Agrega al menos un producto a la venta.",
      status: "error",
    };
  }

  if (customerMode === "registered" && !isValidObjectId(customerId)) {
    return {
      errors: {},
      message: "Selecciona un cliente con datos para la venta.",
      status: "error",
    };
  }

  await connectDB();

  const customer = customerMode === "registered"
    ? await Customer.findById(customerId).lean()
    : null;

  if (customerMode === "registered" && !customer) {
    return {
      errors: {},
      message: "No encontramos el cliente seleccionado.",
      status: "error",
    };
  }

  const variants = await ProductVariant.find({
    _id: { $in: rawItems.map((item) => item.variantId) },
    isActive: true,
  }).lean();
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

    if ((variant.stock || 0) < rawItem.quantity) {
      return {
        errors: {},
        message: `${variant.name} no tiene stock suficiente.`,
        status: "error",
      };
    }

    const unitPrice = roundMoney(variant.price || 0);
    const lineTotal = roundMoney(unitPrice * rawItem.quantity);

    items.push({
      colorName: variant.colorName || "",
      discountAmount: 0,
      productId: variant.product || null,
      productName: variant.baseProductName || variant.name,
      quantity: rawItem.quantity,
      size: variant.size || "",
      sku: variant.sku,
      total: lineTotal,
      unitPrice,
      variantId: variant._id,
    });
  }

  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.total, 0));
  const rawDiscount = discountType === "percent" ? subtotal * (discountValue / 100) : discountValue;
  const discountTotal = roundMoney(Math.min(Math.max(rawDiscount, 0), subtotal));
  const taxableBase = roundMoney(Math.max(subtotal - discountTotal, 0));
  const taxAmount = taxEnabled ? roundMoney(taxableBase * (taxRate / 100)) : 0;
  const total = roundMoney(taxableBase + taxAmount);
  const sale = await Sale.create({
    customer: customer ? buildCustomerSnapshot(customer) : undefined,
    customerMode,
    discountTotal,
    invoiceRequired,
    invoiceStatus: invoiceRequired ? "pending" : "not_required",
    items,
    notes,
    paymentMethod,
    saleStatus: "completed",
    subtotal,
    taxAmount,
    taxEnabled,
    taxRate,
    total,
  });

  for (const item of items) {
    const nextStock = Math.max(0, (variantsById.get(item.variantId.toString())?.stock || 0) - item.quantity);

    await ProductVariant.findByIdAndUpdate(item.variantId, {
      $inc: { stock: -item.quantity },
      $push: {
        stockMovements: {
          note: `Venta ${sale.saleNumber}`,
          quantity: item.quantity,
          stockAfter: nextStock,
          type: "out",
        },
      },
    });
  }

  revalidatePath("/admin/ventas");
  revalidatePath("/admin/catalogo/variantes");
  redirect(`/admin/ventas/${sale._id.toString()}`);
}

export async function updateSaleInvoiceStatus(formData) {
  await requireInternalUser();

  const saleId = getString(formData, "saleId");
  const invoiceStatus = getString(formData, "invoiceStatus");

  if (!isValidObjectId(saleId) || !INVOICE_STATUSES.includes(invoiceStatus)) {
    throw new Error("Estado de factura inválido.");
  }

  await connectDB();

  const sale = await Sale.findByIdAndUpdate(
    saleId,
    {
      invoiceRequired: invoiceStatus !== "not_required",
      invoiceStatus,
    },
    { new: true, runValidators: true }
  ).select("_id");

  if (!sale) {
    throw new Error("No encontramos la venta.");
  }

  revalidatePath("/admin/ventas");
  revalidatePath(`/admin/ventas/${saleId}`);
  redirect(`/admin/ventas/${saleId}`);
}

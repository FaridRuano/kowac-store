"use server";

import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { connectDB } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import { customerSchema } from "@/lib/validators";
import Customer from "@/models/Customer";
import User from "@/models/User";

const initialActionState = {
  errors: {},
  message: "",
  status: "idle",
};

async function requireInternalUser() {
  const user = await getCurrentUser();

  if (!user?.isInternal) {
    throw new Error("No autorizado.");
  }
}

function getString(formData, key) {
  return String(formData.get(key) || "").trim();
}

function normalizeDocumentNumber(value) {
  return value.replace(/\s+/g, "").toUpperCase();
}

function getPositiveInteger(formData, key) {
  const value = Number.parseInt(String(formData.get(key) || "0"), 10);

  return Number.isInteger(value) && value > 0 ? value : 0;
}

function setNestedError(errors, path, message) {
  const [firstKey, secondKey, thirdKey] = path;

  if (!firstKey) {
    return;
  }

  if (!secondKey) {
    errors[firstKey] = [...(errors[firstKey] || []), message];
    return;
  }

  if (firstKey === "addresses" && thirdKey) {
    errors[firstKey] = {
      ...(errors[firstKey] || {}),
      [thirdKey]: [...(errors[firstKey]?.[thirdKey] || []), message],
    };
    return;
  }

  errors[firstKey] = {
    ...(errors[firstKey] || {}),
    [secondKey]: [...(errors[firstKey]?.[secondKey] || []), message],
  };
}

function formatValidationErrors(error) {
  return error.issues.reduce((errors, issue) => {
    setNestedError(errors, issue.path, issue.message);
    return errors;
  }, {});
}

function buildCustomerPayload(formData) {
  const billingMode = getString(formData, "billingMode") || "consumer_final";
  const customerType = getString(formData, "customerType") || "national";
  const shippingAddressCount = getPositiveInteger(formData, "shippingAddressCount");
  const shippingAddresses = Array.from({ length: shippingAddressCount }, (_, index) => ({
    addressLine: getString(formData, `shippingAddressLine_${index}`),
    city: getString(formData, `shippingCity_${index}`),
    country: getString(formData, `shippingCountry_${index}`) || "Ecuador",
    isDefault: index === 0,
    province: getString(formData, `shippingProvince_${index}`),
    reference: getString(formData, `shippingReference_${index}`),
  }));
  const billingCountry = customerType === "national" ? "Ecuador" : getString(formData, "billingCountry");
  const billingAddress = billingMode === "tax_data"
    ? {
        addressLine: getString(formData, "billingAddressLine"),
        city: getString(formData, "billingCity"),
        country: billingCountry,
        isDefault: false,
        province: getString(formData, "billingProvince"),
      }
    : null;

  return {
    addresses: shippingAddresses,
    billingMode,
    billingAddress,
    customerType,
    documentNumber: billingMode === "tax_data" ? normalizeDocumentNumber(getString(formData, "documentNumber")) : "",
    documentType: billingMode === "tax_data" ? getString(formData, "documentType") : "",
    email: getString(formData, "email").toLowerCase(),
    firstName: getString(formData, "firstName"),
    lastName: getString(formData, "lastName"),
    phone: getString(formData, "phone"),
    taxName: billingMode === "tax_data" ? getString(formData, "taxName") : "",
  };
}

function buildAccountPayload(formData) {
  const shouldCreateAccount = formData.get("createAccount") === "on";

  if (!shouldCreateAccount) {
    return {
      createAccount: false,
      password: "",
    };
  }

  return {
    createAccount: true,
    password: String(formData.get("accountPassword") || ""),
  };
}

export async function createCustomer(prevState = initialActionState, formData) {
  void prevState;

  await requireInternalUser();

  const parsedCustomer = customerSchema.safeParse(buildCustomerPayload(formData));
  const account = buildAccountPayload(formData);

  if (!parsedCustomer.success) {
    return {
      errors: formatValidationErrors(parsedCustomer.error),
      message: "Revisa los campos marcados antes de guardar.",
      status: "error",
    };
  }

  if (account.createAccount && account.password.length < 6) {
    return {
      errors: {
        accountPassword: ["La contraseña debe tener al menos 6 caracteres."],
      },
      message: "Revisa los datos de la cuenta antes de guardar.",
      status: "error",
    };
  }

  await connectDB();

  const customer = parsedCustomer.data;
  const duplicateChecks = [{ email: customer.email }];

  if (customer.billingMode === "tax_data" && customer.documentNumber) {
    duplicateChecks.push({
      documentNumber: customer.documentNumber,
      documentType: customer.documentType,
    });
  }

  const duplicateCustomer = await Customer.findOne({
    $or: duplicateChecks,
  }).select("_id email documentNumber").lean();

  if (duplicateCustomer) {
    const duplicateErrors = {
      email: ["Ya existe un cliente con ese correo."],
    };

    if (customer.billingMode === "tax_data") {
      duplicateErrors.documentNumber = ["Ya existe un cliente con ese documento."];
    }

    return {
      errors: duplicateErrors,
      message: "El cliente ya está registrado.",
      status: "error",
    };
  }

  if (account.createAccount) {
    const existingUser = await User.findOne({ email: customer.email }).select("_id").lean();

    if (existingUser) {
      return {
        errors: {
          email: ["Ya existe una cuenta con este correo."],
        },
        message: "No se pudo crear la cuenta de acceso.",
        status: "error",
      };
    }
  }

  const createdCustomer = await Customer.create({
    ...customer,
  });

  if (account.createAccount) {
    const createdUser = await User.create({
      customer: createdCustomer._id,
      email: customer.email,
      isActive: true,
      name: `${customer.firstName} ${customer.lastName}`.trim(),
      password: await hashPassword(account.password),
      role: "usuario",
    });

    createdCustomer.user = createdUser._id;
    await createdCustomer.save();
  }

  revalidatePath("/admin/clientes");
  redirect(`/admin/clientes/${createdCustomer._id.toString()}`);
}

export async function updateCustomer(customerId, prevState = initialActionState, formData) {
  void prevState;

  await requireInternalUser();

  if (!isValidObjectId(customerId)) {
    return {
      errors: {},
      message: "Cliente inválido.",
      status: "error",
    };
  }

  const parsedCustomer = customerSchema.safeParse(buildCustomerPayload(formData));

  if (!parsedCustomer.success) {
    return {
      errors: formatValidationErrors(parsedCustomer.error),
      message: "Revisa los campos marcados antes de guardar.",
      status: "error",
    };
  }

  await connectDB();

  const customer = parsedCustomer.data;
  const currentCustomer = await Customer.findById(customerId).select("_id user").lean();

  if (!currentCustomer) {
    return {
      errors: {},
      message: "Cliente no encontrado.",
      status: "error",
    };
  }

  const duplicateChecks = [{ email: customer.email }];

  if (customer.billingMode === "tax_data" && customer.documentNumber) {
    duplicateChecks.push({
      documentNumber: customer.documentNumber,
      documentType: customer.documentType,
    });
  }

  const duplicateCustomer = await Customer.findOne({
    _id: { $ne: customerId },
    $or: duplicateChecks,
  }).select("_id email documentNumber").lean();

  if (duplicateCustomer) {
    const duplicateErrors = {
      email: ["Ya existe otro cliente con ese correo."],
    };

    if (customer.billingMode === "tax_data") {
      duplicateErrors.documentNumber = ["Ya existe otro cliente con ese documento."];
    }

    return {
      errors: duplicateErrors,
      message: "No se pudo actualizar porque esos datos ya están registrados.",
      status: "error",
    };
  }

  if (currentCustomer.user) {
    const existingUser = await User.findOne({
      _id: { $ne: currentCustomer.user },
      email: customer.email,
    }).select("_id").lean();

    if (existingUser) {
      return {
        errors: {
          email: ["Ya existe una cuenta con este correo."],
        },
        message: "No se pudo sincronizar la cuenta de acceso.",
        status: "error",
      };
    }
  }

  await Customer.findByIdAndUpdate(customerId, customer, { runValidators: true });

  if (currentCustomer.user) {
    await User.findByIdAndUpdate(currentCustomer.user, {
      email: customer.email,
      name: `${customer.firstName} ${customer.lastName}`.trim(),
    });
  }

  revalidatePath("/admin/clientes");
  revalidatePath(`/admin/clientes/${customerId}`);
  redirect(`/admin/clientes/${customerId}`);
}

export async function deactivateCustomer(customerId) {
  await requireInternalUser();

  if (!isValidObjectId(customerId)) {
    throw new Error("Cliente inválido.");
  }

  await connectDB();

  const customer = await Customer.findById(customerId).select("user");

  if (!customer) {
    throw new Error("Cliente no encontrado.");
  }

  customer.isActive = false;
  await customer.save();

  if (customer.user) {
    await User.findByIdAndUpdate(customer.user, { isActive: false });
  }

  revalidatePath("/admin/clientes");
  revalidatePath(`/admin/clientes/${customerId}`);
}

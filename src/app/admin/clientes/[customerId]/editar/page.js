import { ArrowLeft } from "lucide-react";
import { isValidObjectId } from "mongoose";
import Link from "next/link";
import { notFound } from "next/navigation";

import CustomerForm from "@/components/admin/CustomerForm";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";

import { updateCustomer } from "../../actions";

export const metadata = {
  title: "Editar cliente | Admin Kowac",
};

function serializeAddress(address, index) {
  return {
    addressLine: address.addressLine || "",
    city: address.city || "",
    country: address.country || "Ecuador",
    id: `${address.addressLine || "address"}-${index}`,
    province: address.province || "",
    reference: address.reference || "",
  };
}

async function getCustomer(customerId) {
  if (!isValidObjectId(customerId)) {
    notFound();
  }

  await connectDB();

  const customer = await Customer.findById(customerId).lean();

  if (!customer) {
    notFound();
  }

  return {
    addresses: (customer.addresses || []).map(serializeAddress),
    billingAddress: customer.billingAddress
      ? {
          addressLine: customer.billingAddress.addressLine || "",
          city: customer.billingAddress.city || "",
          country: customer.billingAddress.country || "Ecuador",
          province: customer.billingAddress.province || "",
        }
      : null,
    billingMode: customer.billingMode || "consumer_final",
    customerType: customer.customerType || "national",
    documentNumber: customer.documentNumber || "",
    documentType: customer.documentType || "cedula",
    email: customer.email || "",
    firstName: customer.firstName || "",
    id: customer._id.toString(),
    lastName: customer.lastName || "",
    phone: customer.phone || "",
    taxName: customer.taxName || "",
  };
}

export default async function AdminEditCustomerPage({ params }) {
  const { customerId } = await params;
  const customer = await getCustomer(customerId);
  const saveCustomer = updateCustomer.bind(null, customer.id);

  return (
    <div className="admin-page">
      <Link href={`/admin/clientes/${customer.id}`} className="admin-page__action-pill admin-page__back-link">
        <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
        Volver al cliente
      </Link>

      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Clientes</span>
          <h1>Editar cliente</h1>
          <p className="text-muted">
            Actualiza contacto, direcciones de envío y datos de facturación del cliente.
          </p>
        </div>
      </div>

      <CustomerForm
        action={saveCustomer}
        cancelHref={`/admin/clientes/${customer.id}`}
        customer={customer}
        mode="edit"
        submitLabel="Guardar cambios"
      />
    </div>
  );
}

import { ArrowLeft, Save } from "lucide-react";
import { isValidObjectId } from "mongoose";
import Link from "next/link";
import { notFound } from "next/navigation";

import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";

import { addCustomerAddress } from "../actions";

export const metadata = {
  title: "Nueva dirección | Admin Kowac",
};

async function getCustomer(customerId) {
  if (!isValidObjectId(customerId)) {
    notFound();
  }

  await connectDB();

  const customer = await Customer.findById(customerId).select("firstName lastName email").lean();

  if (!customer) {
    notFound();
  }

  return {
    email: customer.email,
    fullName: `${customer.firstName} ${customer.lastName}`.trim(),
    id: customer._id.toString(),
  };
}

export default async function AdminNewCustomerAddressPage({ params }) {
  const { customerId } = await params;
  const customer = await getCustomer(customerId);
  const saveAddress = addCustomerAddress.bind(null, customer.id);

  return (
    <div className="admin-page">
      <Link href={`/admin/clientes/${customer.id}`} className="admin-page__action-pill admin-page__back-link">
        <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
        Volver al cliente
      </Link>

      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Envíos</span>
          <h1>Nueva dirección</h1>
          <p className="text-muted">
            Agrega una dirección manual para preparar envíos de {customer.fullName || customer.email}.
          </p>
        </div>
      </div>

      <form action={saveAddress} className="admin-customer-form">
        <section className="admin-customer-form__section">
          <div className="admin-product-form__header">
            <strong>Dirección de envío</strong>
            <span>Esta dirección quedará disponible para futuros pedidos del cliente.</span>
          </div>

          <div className="admin-product-form__grid">
            <label>
              País
              <input name="country" type="text" defaultValue="Ecuador" autoComplete="country-name" />
            </label>
            <label>
              Provincia
              <input name="province" type="text" required autoComplete="address-level1" />
            </label>
            <label>
              Ciudad
              <input name="city" type="text" required autoComplete="address-level2" />
            </label>
            <label className="admin-product-form__field--wide">
              Dirección
              <input name="addressLine" type="text" required autoComplete="street-address" />
            </label>
            <label className="admin-product-form__field--wide">
              Referencia
              <textarea name="reference" rows={3} placeholder="Sector, edificio, instrucciones de entrega..." />
            </label>
          </div>
        </section>

        <div className="admin-product-form__footer">
          <Link href={`/admin/clientes/${customer.id}`} className="admin-customer-form__secondary-button">
            Cancelar
          </Link>
          <button type="submit">
            <Save size={16} strokeWidth={1.8} aria-hidden="true" />
            Guardar dirección
          </button>
        </div>
      </form>
    </div>
  );
}

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import OrderForm from "@/components/admin/OrderForm";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";
import ProductVariant from "@/models/ProductVariant";

export const metadata = {
  title: "Nuevo pedido a fábrica | Admin Kowac",
};

async function getOrderFormData() {
  await connectDB();

  const [customers, variants] = await Promise.all([
    Customer.find({ isActive: { $ne: false } })
      .select("firstName lastName email phone documentType documentNumber taxName addresses updatedAt")
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean(),
    ProductVariant.find({ isActive: true })
      .select("baseProductName name sku product price stock colorName size")
      .sort({ updatedAt: -1 })
      .limit(180)
      .lean(),
  ]);

  return {
    customers: customers.map((customer) => ({
      addresses: (customer.addresses || []).map((address) => ({
        addressLine: address.addressLine || "",
        city: address.city || "",
        country: address.country || "Ecuador",
        id: address._id?.toString() || `${address.city}-${address.addressLine}`,
        isDefault: Boolean(address.isDefault),
        postalCode: address.postalCode || "",
        province: address.province || "",
        reference: address.reference || "",
      })),
      documentNumber: customer.documentNumber || "",
      documentType: customer.documentType || "",
      email: customer.email || "",
      firstName: customer.firstName || "",
      fullName: `${customer.firstName || ""} ${customer.lastName || ""}`.trim(),
      id: customer._id.toString(),
      lastName: customer.lastName || "",
      phone: customer.phone || "",
      taxName: customer.taxName || "",
    })),
    variants: variants.map((variant) => ({
      colorName: variant.colorName || "",
      id: variant._id.toString(),
      price: variant.price || 0,
      productName: variant.baseProductName || variant.name,
      size: variant.size || "",
      sku: variant.sku,
      stock: variant.stock || 0,
    })),
  };
}

export default async function AdminNewOrderPage() {
  const { customers, variants } = await getOrderFormData();

  return (
    <div className="admin-page">
      <Link href="/admin/pedidos" className="admin-page__action-pill admin-page__back-link">
        <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
        Volver a pedidos
      </Link>

      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Pedidos a fábrica</span>
          <h1>Nuevo pedido a fábrica</h1>
          <p className="text-muted">
            Crea un pedido manual de producción con cliente registrado, productos, entrega, pago y factura opcional.
          </p>
        </div>
      </div>

      <OrderForm customers={customers} variants={variants} />
    </div>
  );
}

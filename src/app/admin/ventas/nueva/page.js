import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import SaleForm from "@/components/admin/SaleForm";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";
import ProductVariant from "@/models/ProductVariant";

export const metadata = {
  title: "Nueva venta directa | Admin Kowac",
};

async function getSaleFormData() {
  await connectDB();

  const [customers, variants] = await Promise.all([
    Customer.find({ isActive: { $ne: false } })
      .select("firstName lastName email phone documentType documentNumber taxName updatedAt")
      .sort({ updatedAt: -1 })
      .limit(80)
      .lean(),
    ProductVariant.find({ isActive: true, stock: { $gt: 0 } })
      .select("baseProductName name sku product price stock colorName size")
      .sort({ updatedAt: -1 })
      .limit(160)
      .lean(),
  ]);

  return {
    customers: customers.map((customer) => ({
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

export default async function AdminNewSalePage() {
  const { customers, variants } = await getSaleFormData();

  return (
    <div className="admin-page">
      <Link href="/admin/ventas" className="admin-page__action-pill admin-page__back-link">
        <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
        Volver a ventas
      </Link>

      <div className="admin-page__header">
        <div>
          <span className="eyebrow">Ventas directas</span>
          <h1>Nueva venta directa</h1>
          <p className="text-muted">
            Registra una venta manual del local físico con productos disponibles en stock, descuento e IVA opcional.
          </p>
        </div>
      </div>

      <SaleForm customers={customers} variants={variants} />
    </div>
  );
}

import mongoose, { Schema } from "mongoose";

const CustomerSnapshotSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    documentType: { type: String, default: "", trim: true },
    documentNumber: { type: String, default: "", trim: true },
    taxName: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const OrderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    productName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    image: { type: String, default: "", trim: true },
    sku: { type: String, required: true, trim: true },
    colorName: { type: String, required: true, trim: true },
    size: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    productionNote: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const ShippingAddressSchema = new Schema(
  {
    country: { type: String, default: "Ecuador", trim: true },
    province: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    postalCode: { type: String, default: "", trim: true },
    addressLine: { type: String, required: true, trim: true },
    reference: { type: String, default: "", trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const ShipmentSchema = new Schema(
  {
    courier: { type: String, default: "", trim: true },
    trackingNumber: { type: String, default: "", trim: true },
    trackingUrl: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const ShippingRecipientSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    fullName: { type: String, default: "", trim: true },
    documentNumber: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => `KWC-${Date.now()}`,
    },
    orderType: {
      type: String,
      enum: ["online_sale", "production_order"],
      default: "production_order",
      index: true,
    },
    customer: {
      type: CustomerSnapshotSchema,
      required: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      default: [],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxEnabled: {
      type: Boolean,
      default: false,
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["transferencia", "payphone", "datafast", "stripe", "manual"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    paymentDepositAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    orderStatus: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
    deliveryMethod: {
      type: String,
      enum: ["shipping", "pickup"],
      default: "shipping",
      index: true,
    },
    shippingAddress: {
      type: ShippingAddressSchema,
      default: null,
    },
    shippingRecipient: {
      type: ShippingRecipientSchema,
      default: () => ({}),
    },
    invoiceRequired: {
      type: Boolean,
      default: false,
    },
    invoiceStatus: {
      type: String,
      enum: ["not_required", "pending", "issued", "cancelled"],
      default: "not_required",
      index: true,
    },
    shipment: {
      type: ShipmentSchema,
      default: () => ({}),
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

if (
  mongoose.models.Order &&
  (!mongoose.models.Order.schema.path("deliveryMethod") ||
    !mongoose.models.Order.schema.path("invoiceRequired") ||
    !mongoose.models.Order.schema.path("taxAmount") ||
    !mongoose.models.Order.schema.path("shippingAddress.country") ||
    !mongoose.models.Order.schema.path("shippingAddress.postalCode") ||
    !mongoose.models.Order.schema.path("shippingRecipient.enabled") ||
    !mongoose.models.Order.schema.path("paymentDepositAmount") ||
    !mongoose.models.Order.schema.path("customer.customerId") ||
    !mongoose.models.Order.schema.path("orderType") ||
    !mongoose.models.Order.schema.path("items.productionNote"))
) {
  mongoose.deleteModel("Order");
}

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);

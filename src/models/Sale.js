import mongoose, { Schema } from "mongoose";

const SaleCustomerSnapshotSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },
    firstName: { type: String, default: "Consumidor", trim: true },
    lastName: { type: String, default: "Final", trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    documentType: {
      type: String,
      enum: ["", "cedula", "ruc", "passport", "foreign_id"],
      default: "",
    },
    documentNumber: { type: String, default: "", trim: true },
    taxName: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const SaleItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    variantId: {
      type: Schema.Types.ObjectId,
      ref: "ProductVariant",
      default: null,
    },
    productName: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    colorName: { type: String, default: "", trim: true },
    size: { type: String, default: "", trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const SaleSchema = new Schema(
  {
    saleNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => `VTA-${Date.now()}`,
    },
    customerMode: {
      type: String,
      enum: ["consumer_final", "registered"],
      default: "consumer_final",
      index: true,
    },
    customer: {
      type: SaleCustomerSnapshotSchema,
      default: () => ({}),
    },
    items: {
      type: [SaleItemSchema],
      required: true,
      default: [],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discountTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxEnabled: {
      type: Boolean,
      default: false,
      index: true,
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
      enum: ["cash", "card", "transfer", "mixed"],
      required: true,
      index: true,
    },
    invoiceRequired: {
      type: Boolean,
      default: false,
      index: true,
    },
    invoiceStatus: {
      type: String,
      enum: ["not_required", "pending", "issued", "cancelled"],
      default: "not_required",
      index: true,
    },
    saleStatus: {
      type: String,
      enum: ["completed", "voided"],
      default: "completed",
      index: true,
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

export default mongoose.models.Sale || mongoose.model("Sale", SaleSchema);

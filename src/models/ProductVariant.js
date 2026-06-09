import mongoose, { Schema } from "mongoose";

const VariantMediaSchema = new Schema(
  {
    provider: {
      type: String,
      enum: ["vercel_blob", "r2", "cloudinary", "mux", "external"],
      default: "external",
    },
    type: {
      type: String,
      enum: ["image", "video"],
      default: "image",
    },
    url: {
      type: String,
      default: "",
      trim: true,
    },
    secureUrl: {
      type: String,
      default: "",
      trim: true,
    },
    storageKey: {
      type: String,
      default: "",
      trim: true,
    },
    publicId: {
      type: String,
      default: "",
      trim: true,
    },
    assetId: {
      type: String,
      default: "",
      trim: true,
    },
    playbackId: {
      type: String,
      default: "",
      trim: true,
    },
    alt: {
      type: String,
      default: "",
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    width: {
      type: Number,
      default: null,
      min: 0,
    },
    height: {
      type: Number,
      default: null,
      min: 0,
    },
    format: {
      type: String,
      default: "",
      trim: true,
    },
    bytes: {
      type: Number,
      default: null,
      min: 0,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    isSecondary: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "ready", "errored"],
      default: "ready",
    },
  },
  { _id: false, timestamps: true }
);

const VariantDiscountSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["none", "percent", "fixed"],
      default: "none",
    },
    value: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const StockMovementSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["in", "out"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    stockAfter: {
      type: Number,
      required: true,
      min: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ProductVariantSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    baseProductName: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    optionSignature: {
      type: String,
      required: true,
      trim: true,
    },
    optionValues: {
      type: Map,
      of: String,
      default: {},
    },
    size: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    colorName: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    colorHex: {
      type: String,
      default: "",
      trim: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    reservedStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    stockMovements: {
      type: [StockMovementSchema],
      default: [],
    },
    cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    compareAtPrice: {
      type: Number,
      default: null,
      min: 0,
    },
    discount: {
      type: VariantDiscountSchema,
      default: () => ({ type: "none" }),
    },
    media: {
      type: [VariantMediaSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["draft", "active", "inactive"],
      default: "draft",
      index: true,
    },
    showInCatalog: {
      type: Boolean,
      default: false,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
      index: true,
    },
    isTrending: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

ProductVariantSchema.index({ product: 1, optionSignature: 1 }, { unique: true });

if (
  mongoose.models.ProductVariant &&
  (!mongoose.models.ProductVariant.schema.path("discount") ||
    !mongoose.models.ProductVariant.schema.path("isFeatured") ||
    !mongoose.models.ProductVariant.schema.path("isNewArrival") ||
    !mongoose.models.ProductVariant.schema.path("isTrending") ||
    !mongoose.models.ProductVariant.schema.path("stockMovements") ||
    !mongoose.models.ProductVariant.schema.path("media.0.width") ||
    !mongoose.models.ProductVariant.schema.path("media.0.isSecondary") ||
    !mongoose.models.ProductVariant.schema.path("media.0.isFeatured"))
) {
  mongoose.deleteModel("ProductVariant");
}

export default mongoose.models.ProductVariant || mongoose.model("ProductVariant", ProductVariantSchema);

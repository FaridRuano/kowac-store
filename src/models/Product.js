import mongoose, { Schema } from "mongoose";

const ProductMediaSchema = new Schema(
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
    duration: {
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
    sortOrder: {
      type: Number,
      default: 0,
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

const ProductOptionValueSchema = new Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
    hex: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const ProductOptionSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    values: {
      type: [ProductOptionValueSchema],
      default: [],
    },
  },
  { _id: false }
);

const ProductDiscountSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["inherit", "none", "percent", "fixed"],
      default: "none",
    },
    value: {
      type: Number,
      default: 0,
      min: 0,
    },
    startsAt: {
      type: Date,
      default: null,
    },
    endsAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const ProductMediaGroupSchema = new Schema(
  {
    optionKey: {
      type: String,
      required: true,
      trim: true,
    },
    optionValue: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      default: "",
      trim: true,
    },
    media: {
      type: [ProductMediaSchema],
      default: [],
    },
  },
  { _id: false }
);

const ProductVariantSchema = new Schema(
  {
    sku: {
      type: String,
      required: true,
      trim: true,
    },
    optionValues: {
      type: Map,
      of: String,
      default: {},
    },
    colorName: {
      type: String,
      default: "",
      trim: true,
    },
    colorHex: {
      type: String,
      default: "",
      trim: true,
    },
    size: {
      type: String,
      default: "",
      trim: true,
    },
    costOverride: {
      type: Number,
      default: null,
      min: 0,
    },
    priceOverride: {
      type: Number,
      default: null,
      min: 0,
    },
    compareAtPriceOverride: {
      type: Number,
      default: null,
      min: 0,
    },
    discount: {
      type: ProductDiscountSchema,
      default: () => ({ type: "inherit" }),
    },
    media: {
      type: [ProductMediaSchema],
      default: [],
    },
    showInCatalog: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    shortDescription: {
      type: String,
      default: "",
      trim: true,
    },
    brand: {
      type: String,
      default: "Kowac",
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    gender: {
      type: String,
      enum: ["hombre", "mujer", "unisex", "niños"],
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["zapatos", "ropa"],
      required: true,
      index: true,
    },
    apparelFit: {
      type: String,
      enum: ["", "normal", "oversize", "fit"],
      default: "",
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "active", "inactive"],
      default: "draft",
      index: true,
    },
    baseCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    basePrice: {
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
    images: {
      type: [String],
      default: [],
    },
    options: {
      type: [ProductOptionSchema],
      default: [],
    },
    mediaGroups: {
      type: [ProductMediaGroupSchema],
      default: [],
    },
    productDiscount: {
      type: ProductDiscountSchema,
      default: () => ({ type: "none" }),
    },
    tags: {
      type: [String],
      default: [],
    },
    variants: {
      type: [ProductVariantSchema],
      default: [],
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    showInCatalog: {
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

ProductSchema.index({ type: 1, category: 1, status: 1, showInCatalog: 1, isActive: 1, name: 1 });

if (
  mongoose.models.Product &&
  (!mongoose.models.Product.schema.path("apparelFit") ||
    !mongoose.models.Product.schema.path("mediaGroups.0.media.0.isSecondary") ||
    !mongoose.models.Product.schema.path("mediaGroups.0.media.0.isFeatured"))
) {
  mongoose.deleteModel("Product");
}

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);

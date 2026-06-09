import mongoose, { Schema } from "mongoose";

const AddressSchema = new Schema(
  {
    country: {
      type: String,
      default: "Ecuador",
      trim: true,
    },
    province: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    addressLine: {
      type: String,
      required: true,
      trim: true,
    },
    reference: {
      type: String,
      default: "",
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const CustomerSchema = new Schema(
  {
    customerType: {
      type: String,
      enum: ["national", "foreign"],
      default: "national",
      index: true,
    },
    billingMode: {
      type: String,
      enum: ["consumer_final", "tax_data"],
      default: "consumer_final",
      index: true,
    },
    documentType: {
      type: String,
      enum: ["", "cedula", "ruc", "passport", "foreign_id"],
      default: "",
      index: true,
    },
    documentNumber: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    taxName: {
      type: String,
      default: "",
      trim: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    addresses: {
      type: [AddressSchema],
      default: [],
    },
    billingAddress: {
      type: AddressSchema,
      default: null,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
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

if (
  mongoose.models.Customer &&
  (!mongoose.models.Customer.schema.path("customerType") ||
    !mongoose.models.Customer.schema.path("billingMode") ||
    !mongoose.models.Customer.schema.path("documentType") ||
    !mongoose.models.Customer.schema.path("billingAddress.country") ||
    !mongoose.models.Customer.schema.path("user") ||
    !mongoose.models.Customer.schema.path("isActive"))
) {
  mongoose.deleteModel("Customer");
}

export default mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);

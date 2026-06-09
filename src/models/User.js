import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema(
  {
    name: {
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
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["usuario", "admin"],
      default: "usuario",
      index: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
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
  mongoose.models.User &&
  !mongoose.models.User.schema.path("customer")
) {
  mongoose.deleteModel("User");
}

export default mongoose.models.User || mongoose.model("User", UserSchema);

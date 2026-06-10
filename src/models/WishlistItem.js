import mongoose, { Schema } from "mongoose";

const WishlistItemSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

WishlistItemSchema.index({ user: 1, product: 1 }, { unique: true });

export default mongoose.models.WishlistItem || mongoose.model("WishlistItem", WishlistItemSchema);

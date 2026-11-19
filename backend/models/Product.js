import mongoose from "mongoose";

const { Schema } = mongoose;

const productSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    price: { type: Number, required: true, min: 0 },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    subcategory: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    brand: { type: String, trim: true, default: "", maxlength: 80 },
    condition: {
      type: String,
      enum: ["Neu", "Wie neu", "Sehr gut", "Gut", "Akzeptabel"],
      required: true,
    },
    city: { type: String, trim: true, required: true, maxlength: 80 },
    postalCode: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (value) => /^\d{5}$/.test(value),
        message: "Bitte eine gültige deutsche Postleitzahl (5 Ziffern) angeben",
      },
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, default: "" },
        isMain: { type: Boolean, default: false },
      },
    ],
    availability: {
      type: String,
      enum: ["available", "reserved", "sold"],
      default: "available",
    },
    shippingOptions: [
      {
        type: { type: String, trim: true, default: "Versand" },
        cost: { type: Number, min: 0, default: 0 },
      },
    ],
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    views: { type: Number, default: 0, min: 0 },
    favoritesCount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["draft", "pending", "active", "inactive", "sold"],
      default: "active",
      index: true,
    },
    fraudScore: { type: Number, default: 0, min: 0, max: 100 },
    flags: { type: [String], default: [] },
  },
  { timestamps: true },
);

productSchema.index({ title: "text", description: "text", brand: "text" });
productSchema.index({ price: 1, status: 1 });
productSchema.index({ postalCode: 1, city: 1 });
productSchema.index({ createdAt: -1 });

export const Product = mongoose.model("Product", productSchema);
export default Product;

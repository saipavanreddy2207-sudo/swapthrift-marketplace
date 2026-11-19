import mongoose from "mongoose";

const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    price: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "EUR", enum: ["EUR"] },
    address: {
      firstName: String,
      lastName: String,
      street: String,
      houseNumber: String,
      postalCode: String,
      city: String,
      country: { type: String, default: "Deutschland" },
    },
    shipping: {
      carrier: { type: String, trim: true, default: "" },
      trackingNumber: { type: String, trim: true, default: "" },
      status: {
        type: String,
        enum: ["not_shipped", "in_transit", "delivered", "returned"],
        default: "not_shipped",
      },
    },
    status: {
      type: String,
      enum: [
        "pending",
        "payment_processing",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
      index: true,
    },
    payment: { type: Schema.Types.ObjectId, ref: "Payment", default: null },
    timeline: [
      {
        status: { type: String, required: true },
        at: { type: Date, default: Date.now },
        note: { type: String, trim: true, default: "" },
      },
    ],
  },
  { timestamps: true },
);

orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ seller: 1, createdAt: -1 });

export const Order = mongoose.model("Order", orderSchema);
export default Order;

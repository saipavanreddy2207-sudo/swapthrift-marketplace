import mongoose from "mongoose";

const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    stripePaymentIntentId: { type: String, default: null, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "eur", lowercase: true },
    status: {
      type: String,
      enum: ["requires_payment_method", "processing", "succeeded", "failed", "refunded"],
      default: "requires_payment_method",
    },
    method: { type: String, default: "card" },
    refunds: [
      {
        amount: { type: Number, required: true, min: 0 },
        reason: { type: String, trim: true, default: "" },
        at: { type: Date, default: Date.now },
      },
    ],
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;

import mongoose from "mongoose";

const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    reviewer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", default: null },
    order: { type: Schema.Types.ObjectId, ref: "Order", default: null },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, trim: true, maxlength: 3000, default: "" },
    sellerResponse: {
      text: { type: String, trim: true, maxlength: 3000, default: "" },
      at: { type: Date, default: null },
    },
    isVerifiedPurchase: { type: Boolean, default: false },
    isReported: { type: Boolean, default: false },
  },
  { timestamps: true },
);

reviewSchema.index({ reviewer: 1, product: 1 }, { unique: true, sparse: true });
reviewSchema.index({ seller: 1, createdAt: -1 });

export const Review = mongoose.model("Review", reviewSchema);
export default Review;

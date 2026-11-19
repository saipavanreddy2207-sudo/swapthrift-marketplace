import mongoose from "mongoose";

const { Schema } = mongoose;

const reportSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["product", "user", "message", "review"],
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    reason: {
      type: String,
      enum: [
        "fake_product",
        "suspicious_seller",
        "scam",
        "inappropriate_content",
        "misleading_description",
        "suspicious_message",
        "other",
      ],
      required: true,
    },
    details: { type: String, trim: true, maxlength: 2000, default: "" },
    status: {
      type: String,
      enum: ["open", "reviewing", "resolved", "dismissed"],
      default: "open",
      index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    resolution: { type: String, trim: true, maxlength: 2000, default: "" },
  },
  { timestamps: true },
);

reportSchema.index({ reporter: 1, createdAt: -1 });

export const Report = mongoose.model("Report", reportSchema);
export default Report;

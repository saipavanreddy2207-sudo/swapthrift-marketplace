import mongoose from "mongoose";

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      trim: true,
      required: true,
      enum: [
        "message",
        "order",
        "payment",
        "product",
        "review",
        "report",
        "system",
        "verification",
      ],
      default: "system",
    },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    message: { type: String, trim: true, maxlength: 1000, default: "" },
    data: { type: Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false },
    link: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;

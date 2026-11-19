import mongoose from "mongoose";

const { Schema } = mongoose;

const conversationSchema = new Schema(
  {
    participants: [
      { type: Schema.Types.ObjectId, ref: "User", required: true },
    ],
    product: { type: Schema.Types.ObjectId, ref: "Product", default: null },
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message", default: null },
    unreadFor: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

conversationSchema.index({ participants: 1, updatedAt: -1 });
conversationSchema.index({ product: 1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;

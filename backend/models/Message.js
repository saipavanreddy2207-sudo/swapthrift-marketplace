import mongoose from "mongoose";

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, trim: true, maxlength: 4000, default: "" },
    image: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isFlagged: { type: Boolean, default: false },
  },
  { timestamps: true },
);

messageSchema.index({ conversation: 1, createdAt: 1 });

export const Message = mongoose.model("Message", messageSchema);
export default Message;

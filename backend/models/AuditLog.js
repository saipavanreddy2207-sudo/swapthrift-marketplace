import mongoose from "mongoose";

const { Schema } = mongoose;

const auditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    action: { type: String, required: true, trim: true, maxlength: 120 },
    target: { type: Schema.Types.Mixed, default: null },
    meta: {
      ip: { type: String, default: "" },
      userAgent: { type: String, default: "" },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;

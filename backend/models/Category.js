import mongoose from "mongoose";

const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    parent: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    icon: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

categorySchema.index({ parent: 1, sortOrder: 1 });

export const Category = mongoose.model("Category", categorySchema);
export default Category;

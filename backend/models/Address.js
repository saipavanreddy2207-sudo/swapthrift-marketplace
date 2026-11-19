import mongoose from "mongoose";

const { Schema } = mongoose;

const addressSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    label: { type: String, trim: true, default: "Zuhause" },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    houseNumber: { type: String, required: true, trim: true },
    postalCode: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (value) => /^\d{5}$/.test(value),
        message: "Bitte eine gültige deutsche Postleitzahl (5 Ziffern) angeben",
      },
    },
    city: { type: String, required: true, trim: true },
    country: { type: String, trim: true, default: "Deutschland" },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

addressSchema.index({ user: 1, isDefault: -1 });

export const Address = mongoose.model("Address", addressSchema);
export default Address;

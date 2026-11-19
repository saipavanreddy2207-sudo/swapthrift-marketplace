import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false, minlength: 8 },
    phone: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    postalCode: {
      type: String,
      trim: true,
      validate: {
        validator: (value) => !value || /^\d{5}$/.test(value),
        message: "Bitte eine gültige deutsche Postleitzahl (5 Ziffern) angeben",
      },
    },
    roles: {
      type: [String],
      enum: ["user", "seller", "admin"],
      default: ["user"],
    },
    avatar: {
      publicId: { type: String, default: null },
      url: { type: String, default: null },
    },
    bio: { type: String, trim: true, maxlength: 1000, default: "" },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: null },
    emailVerificationExpires: { type: Date, default: null },
    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false },
    location: {
      city: { type: String, trim: true, default: "" },
      postalCode: {
        type: String,
        trim: true,
        validate: {
          validator: (value) => !value || /^\d{5}$/.test(value),
          message: "Ungültige Postleitzahl",
        },
      },
      coordinates: { type: [Number], default: undefined },
    },
    notificationPreferences: {
      email: {
        offers: { type: Boolean, default: true },
        messages: { type: Boolean, default: true },
        newsletter: { type: Boolean, default: false },
      },
      inApp: {
        offers: { type: Boolean, default: true },
        messages: { type: Boolean, default: true },
      },
    },
    gdprConsent: {
      terms: { type: Boolean, default: false },
      privacy: { type: Boolean, default: false },
      acceptedAt: { type: Date, default: null },
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, 12);
    return next();
  } catch (error) {
    return next(error);
  }
});

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  if (!this.password || typeof candidate !== "string") return false;
  return bcrypt.compare(candidate, this.password);
};

// Alias kept for callers that use the conventional name.
userSchema.methods.correctPassword = function correctPassword(candidate) {
  return this.comparePassword(candidate);
};

userSchema.set("toJSON", {
  virtuals: true,
  transform(doc, ret) {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    delete ret.emailVerificationToken;
    delete ret.emailVerificationExpires;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    return ret;
  },
});

userSchema.index({ city: 1, postalCode: 1 });

export const User = mongoose.model("User", userSchema);
export default User;

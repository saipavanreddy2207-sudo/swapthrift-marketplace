import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Ungültige ID");

const emailField = z
  .string()
  .trim()
  .email("Bitte eine gültige E-Mail-Adresse angeben")
  .toLowerCase();

const passwordField = z
  .string()
  .min(8, "Das Passwort muss mindestens 8 Zeichen lang sein")
  .max(128, "Das Passwort darf höchstens 128 Zeichen lang sein");

const postalCodeField = z
  .string()
  .trim()
  .regex(/^\d{5}$/, "Bitte eine gültige deutsche Postleitzahl (5 Ziffern) angeben");

const optionalText = (max = 120) =>
  z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().trim().max(max).optional(),
  );

/** Accepts real arrays, JSON-encoded arrays and single values from multipart forms. */
function flexibleArray(itemSchema, max) {
  const arraySchema = max ? z.array(itemSchema).max(max) : z.array(itemSchema);
  return z.preprocess((value) => {
    if (value === undefined || value === null || value === "") return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [value];
      }
    }
    return [value];
  }, arraySchema);
}

const conditionEnum = z.enum(["Neu", "Wie neu", "Sehr gut", "Gut", "Akzeptabel"]);
const availabilityEnum = z.enum(["available", "reserved", "sold"]);
const productStatusEnum = z.enum(["draft", "pending", "active", "inactive", "sold"]);

export const registerSchema = z.object({
  firstName: z.string().trim().min(2, "Der Vorname muss mindestens 2 Zeichen lang sein").max(50),
  lastName: z.string().trim().min(2, "Der Nachname muss mindestens 2 Zeichen lang sein").max(50),
  email: emailField,
  password: passwordField,
  phone: optionalText(30),
  city: z.string().trim().min(2, "Bitte eine Stadt angeben").max(80),
  postalCode: postalCodeField,
  terms: z.boolean().refine((value) => value === true, {
    message: "Bitte die Nutzungsbedingungen akzeptieren",
  }),
  privacy: z.boolean().refine((value) => value === true, {
    message: "Bitte die Datenschutzerklärung akzeptieren",
  }),
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Bitte ein Passwort angeben"),
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, "Ungültiger Reset-Token"),
  password: passwordField,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(10, "Ungültiger Bestätigungstoken"),
});

export const resendVerificationSchema = z.object({
  email: emailField.optional(),
});

export const changeEmailSchema = z.object({
  newEmail: emailField,
  password: z.string().min(1, "Bitte gib dein Passwort ein"),
});

export const reportSchema = z.object({
  reason: z.enum([
    "fake_product",
    "suspicious_seller",
    "scam",
    "inappropriate_content",
    "misleading_description",
    "suspicious_message",
    "other",
  ]),
  details: z.string().trim().max(2000).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Bitte das aktuelle Passwort angeben"),
  newPassword: passwordField,
});

export const profileUpdateSchema = z
  .object({
    firstName: z.string().trim().min(2).max(50).optional(),
    lastName: z.string().trim().min(2).max(50).optional(),
    phone: optionalText(30),
    city: z.string().trim().min(2).max(80).optional(),
    postalCode: postalCodeField.optional(),
    bio: z.preprocess(
      (value) => (value === "" || value === null ? "" : value),
      z.string().trim().max(1000).optional(),
    ),
    location: z
      .object({
        city: z.string().trim().max(80).optional(),
        postalCode: postalCodeField.optional(),
        coordinates: z
          .array(z.number())
          .min(2)
          .max(2)
          .optional(),
      })
      .optional(),
    notificationPreferences: z
      .object({
        email: z
          .object({
            offers: z.boolean().optional(),
            messages: z.boolean().optional(),
            newsletter: z.boolean().optional(),
          })
          .optional(),
        inApp: z
          .object({
            offers: z.boolean().optional(),
            messages: z.boolean().optional(),
          })
          .optional(),
      })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Keine zu aktualisierenden Felder übergeben",
  });

export const shippingOptionSchema = z.object({
  type: z.string().trim().min(1, "Versandart angeben").max(60),
  cost: z.coerce.number().min(0, "Die Versandkosten dürfen nicht negativ sein"),
});

export const productSchema = z.object({
  title: z.string().trim().min(3, "Der Titel muss mindestens 3 Zeichen lang sein").max(120),
  description: z
    .string()
    .trim()
    .min(10, "Die Beschreibung muss mindestens 10 Zeichen lang sein")
    .max(5000),
  price: z.coerce.number().min(0, "Der Preis darf nicht negativ sein").max(1000000),
  category: objectId,
  subcategory: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    objectId.optional(),
  ),
  brand: optionalText(80),
  condition: conditionEnum,
  city: z.string().trim().min(2, "Bitte eine Stadt angeben").max(80),
  postalCode: postalCodeField,
  availability: availabilityEnum.default("available"),
  shippingOptions: flexibleArray(shippingOptionSchema, 10),
  status: productStatusEnum.optional(),
});

// Empty bodies are allowed so image-only updates work as well.
export const productUpdateSchema = productSchema.partial().extend({
  removeImages: flexibleArray(z.string(), 5).optional(),
});

export const productStatusSchema = z.object({
  status: productStatusEnum,
});

export const sellerQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(4),
});

export const productQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  category: objectId.optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  condition: conditionEnum.optional(),
  city: z.string().trim().max(80).optional(),
  postalCode: postalCodeField.optional(),
  shipping: z.string().trim().max(60).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "popular"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

/* -------------------------------------------------------------------------- */
/* Validation schemas for the remaining API modules                           */
/* -------------------------------------------------------------------------- */

export const idParamSchema = z.object({ id: objectId });
export const productIdParamSchema = z.object({ productId: objectId });

const personNameField = z
  .string()
  .trim()
  .min(2, "Bitte einen Namen angeben")
  .max(50, "Der Name darf höchstens 50 Zeichen lang sein");

const addressFields = {
  firstName: personNameField,
  lastName: personNameField,
  street: z
    .string()
    .trim()
    .min(2, "Bitte eine Straße angeben")
    .max(120, "Die Straße darf höchstens 120 Zeichen lang sein"),
  houseNumber: z
    .string()
    .trim()
    .min(1, "Bitte eine Hausnummer angeben")
    .max(20, "Die Hausnummer darf höchstens 20 Zeichen lang sein"),
  postalCode: postalCodeField,
  city: z
    .string()
    .trim()
    .min(2, "Bitte eine Stadt angeben")
    .max(80, "Die Stadt darf höchstens 80 Zeichen lang sein"),
  country: z
    .string()
    .trim()
    .min(2, "Bitte ein Land angeben")
    .max(60, "Das Land darf höchstens 60 Zeichen lang sein"),
};

const addressLabelField = z
  .string()
  .trim()
  .min(1, "Bitte eine Bezeichnung angeben")
  .max(50, "Die Bezeichnung darf höchstens 50 Zeichen lang sein");

export const addressSchema = z.object({
  ...addressFields,
  label: addressLabelField.default("Zuhause"),
  country: addressFields.country.default("Deutschland"),
  isDefault: z.boolean().default(false),
});

// Built without defaults so partial updates never overwrite untouched fields.
export const addressUpdateSchema = z
  .object({
    ...addressFields,
    label: addressLabelField,
    isDefault: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Keine zu aktualisierenden Felder übergeben",
  });

export const conversationSchema = z.object({
  productId: objectId,
  receiverId: objectId,
});

export const messageSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Bitte eine Nachricht eingeben")
    .max(4000, "Die Nachricht darf höchstens 4000 Zeichen lang sein"),
});

export const messageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const checkoutAddressSchema = z.object({
  ...addressFields,
  country: addressFields.country.default("Deutschland"),
});

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: objectId,
        quantity: z.coerce
          .number()
          .int("Bitte eine ganze Zahl angeben")
          .refine((value) => value === 1, {
            message: "Pro Angebot kann nur 1 Stück bestellt werden",
          }),
      }),
    )
    .min(1, "Bitte mindestens ein Angebot auswählen")
    .max(20, "Es können höchstens 20 Angebote bestellt werden"),
  address: checkoutAddressSchema,
  shippingMethod: z.enum(["versand", "abholung"]),
  mode: z.enum(["demo", "stripe"]).default("demo"),
});

export const orderQuerySchema = z.object({
  role: z.enum(["buyer", "seller", "all"]).default("all"),
});

export const orderStatusSchema = z.object({
  status: z.enum(["processing", "shipped", "delivered", "cancelled", "refunded", "returned"]),
  carrier: z.string().trim().max(80).optional(),
  trackingNumber: z.string().trim().max(120).optional(),
});

export const reviewSchema = z.object({
  orderId: objectId,
  rating: z.coerce
    .number()
    .int()
    .min(1, "Bitte eine Bewertung von 1 bis 5 Sternen abgeben")
    .max(5, "Bitte eine Bewertung von 1 bis 5 Sternen abgeben"),
  text: z.string().trim().max(3000, "Die Bewertung darf höchstens 3000 Zeichen lang sein").optional(),
});

export const reviewResponseSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Bitte eine Antwort eingeben")
    .max(3000, "Die Antwort darf höchstens 3000 Zeichen lang sein"),
});

export const reviewQuerySchema = z.object({
  seller: objectId.optional(),
  product: objectId.optional(),
});

export const notificationQuerySchema = z.object({
  unreadOnly: z.preprocess(
    (value) => value === true || value === "true",
    z.boolean().default(false),
  ),
});

export const adminReportQuerySchema = z.object({
  status: z.enum(["open", "reviewing", "resolved", "dismissed"]).optional(),
});

export const adminReportUpdateSchema = z.object({
  status: z.enum(["open", "reviewing", "resolved", "dismissed"]),
  resolution: optionalText(2000),
});

export const adminProductQuerySchema = z.object({
  status: z.enum(["draft", "pending", "active", "inactive", "sold"]).optional(),
});

export const adminUserQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const adminUserStatusSchema = z
  .object({
    isActive: z.boolean().optional(),
    isSuspended: z.boolean().optional(),
    roles: z
      .array(z.enum(["user", "seller", "admin"]))
      .min(1)
      .max(3)
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Keine zu aktualisierenden Felder übergeben",
  });

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Bitte einen Kategorienamen angeben")
    .max(80, "Der Kategoriename darf höchstens 80 Zeichen lang sein"),
  slug: z
    .string()
    .trim()
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Bitte einen gültigen Slug angeben")
    .optional(),
  parent: objectId.optional(),
  icon: optionalText(20),
  description: optionalText(500),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export default {
  registerSchema,
  loginSchema,
  productSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  addressSchema,
  addressUpdateSchema,
  conversationSchema,
  messageSchema,
  checkoutSchema,
  orderStatusSchema,
  reviewSchema,
  reviewResponseSchema,
  notificationQuerySchema,
  categorySchema,
};

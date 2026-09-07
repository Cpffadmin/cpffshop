import mongoose from "mongoose";
import { Address } from "@/types";

interface UserDocument extends mongoose.Document {
  name?: string;
  email: string;
  password?: string;
  image?: string;
  profileImage?: string;
  admin: boolean;
  role: "admin" | "accounting" | "logistics" | "user";
  phone?: string; // Change to string type
  address?: Address;
  isPeriodPaidUser: boolean;
  paymentPeriod: "weekly" | "monthly" | null;
  notificationPreferences: {
    orderUpdates: boolean;
    promotions: boolean;
  };
  wishlist: mongoose.Types.ObjectId[];
  cart: Record<string, unknown>[];
  orderTemplates: {
    name: string;
    displayNames?: { en?: string; "zh-TW"?: string };
    items: { product: mongoose.Types.ObjectId; quantity: number }[];
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// Saved quick-order lists. Unlike `cart`, these store only product ids and
// quantities: names, images and prices are resolved from the live catalogue on
// load, so a saved list can never show a stale price or resurrect a product
// that was deleted (the trap `removeDeletedProductsFromCart` exists to clean up).
const orderTemplateSchema = new mongoose.Schema(
  {
    // `name` stays the single source of truth for sorting and legacy lists saved
    // before bilingual names existed; `displayNames` is what the UI renders.
    name: {
      type: String,
      required: [true, "List name is required"],
      trim: true,
      maxlength: 60,
    },
    displayNames: {
      en: { type: String, trim: true, maxlength: 60, default: "" },
      "zh-TW": { type: String, trim: true, maxlength: 60, default: "" },
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema<UserDocument>(
  {
    name: String,
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: String,
    image: String,
    profileImage: String,
    admin: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["admin", "accounting", "logistics", "user"],
      default: "user",
    },
    phone: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^\d{8,}$/.test(v); // Allow empty string and validate minimum 8 digits
        },
        message: (props) =>
          `${props.value} is not a valid phone number! Must be at least 8 digits.`,
      },
    },
    address: {
      en: String,
      "zh-TW": String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    isPeriodPaidUser: {
      type: Boolean,
      default: false,
    },
    paymentPeriod: {
      type: String,
      enum: ["weekly", "monthly", null],
      default: null,
    },
    notificationPreferences: {
      orderUpdates: {
        type: Boolean,
        default: true,
      },
      promotions: {
        type: Boolean,
        default: true,
      },
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        default: [],
      },
    ],
    // Account-persistent shopping cart. Stored as flexible documents because
    // cart items carry dynamic `selectedSpecifications` (arbitrary keys with
    // multilingual { en, "zh-TW" } values) that a strict schema would strip.
    cart: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    orderTemplates: {
      type: [orderTemplateSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const User =
  mongoose.models.User || mongoose.model<UserDocument>("User", userSchema);
export default User;

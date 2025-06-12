import mongoose from "mongoose";
import Product from "./Product";

// Multilingual string schema
const multilingualStringSchema = new mongoose.Schema(
  {
    en: String,
    "zh-TW": String,
  },
  { _id: false }
);

// Separate address schema with multilingual support
const addressSchema = new mongoose.Schema(
  {
    roomFlat: multilingualStringSchema,
    floor: multilingualStringSchema,
    blockNumber: multilingualStringSchema,
    blockName: multilingualStringSchema,
    buildingName: multilingualStringSchema,
    streetNumber: multilingualStringSchema,
    streetName: multilingualStringSchema,
    district: {
      type: String,
      enum: [
        "Central and Western",
        "Eastern",
        "Southern",
        "Wan Chai",
        "Kowloon City",
        "Kwun Tong",
        "Sham Shui Po",
        "Wong Tai Sin",
        "Yau Tsim Mong",
        "Islands",
        "Kwai Tsing",
        "North",
        "Sai Kung",
        "Sha Tin",
        "Tai Po",
        "Tsuen Wan",
        "Tuen Mun",
        "Yuen Long",
      ],
    },
    location: {
      type: String,
      enum: ["Hong Kong Island", "Kowloon", "New Territories"],
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: false,
      default: null,
    },
    admin: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["admin", "accounting", "logistics", "user"],
      default: "user",
    },
    profileImage: {
      type: String,
      default: "/profile.jpg",
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    notificationPreferences: {
      type: Map,
      of: Boolean,
      default: {
        orderUpdates: true,
        promotions: true,
        newsletter: true,
      },
    },
    cart: {
      type: Array,
      default: [],
    },
    phone: {
      type: String,
    },
    address: {
      type: addressSchema,
      required: false,
      default: null,
    },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;

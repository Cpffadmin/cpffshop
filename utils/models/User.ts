import mongoose from "mongoose";
import Product from "./Product";
import { formatAddress } from "../formatAddress";

// Multilingual string schema with comments for proper ordering
const multilingualStringSchema = new mongoose.Schema(
  {
    // English format: Room → Building → Street → District → City → State → Country
    en: String,
    // Traditional Chinese format: 國家 → 州/省 → 城市 → 地區 → 街道 → 大廈 → 樓層 → 室
    "zh-TW": String,
  },
  { _id: false }
);

// Hong Kong districts enum
const HK_DISTRICTS = [
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
] as const;

// Hong Kong locations enum
const HK_LOCATIONS = [
  "Hong Kong Island",
  "Kowloon",
  "New Territories",
] as const;

// Address schema structured to support both English and Chinese ordering
const addressSchema = new mongoose.Schema(
  {
    // Smallest unit (en: first, zh-TW: last)
    room: multilingualStringSchema,
    floor: multilingualStringSchema,

    // Building information
    building: multilingualStringSchema,

    // Street level
    street: multilingualStringSchema,
    district: {
      en: {
        type: String,
        enum: HK_DISTRICTS,
      },
      "zh-TW": {
        type: String,
        enum: HK_DISTRICTS,
      },
    },

    // Larger administrative regions
    city: multilingualStringSchema,
    state: multilingualStringSchema,
    country: multilingualStringSchema,

    // Additional info
    postalCode: multilingualStringSchema,

    // Location (Hong Kong specific)
    location: {
      en: {
        type: String,
        enum: HK_LOCATIONS,
      },
      "zh-TW": {
        type: String,
        enum: HK_LOCATIONS,
      },
    },

    // Store the complete formatted address strings
    formattedAddress: {
      en: String,
      "zh-TW": String,
    },
  },
  {
    _id: false,
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Pre-save middleware to format addresses
addressSchema.pre("save", function (next) {
  if (this.isModified()) {
    try {
      const addressData = {
        room: { en: this.room?.en, "zh-TW": this.room?.["zh-TW"] },
        floor: { en: this.floor?.en, "zh-TW": this.floor?.["zh-TW"] },
        building: { en: this.building?.en, "zh-TW": this.building?.["zh-TW"] },
        street: { en: this.street?.en, "zh-TW": this.street?.["zh-TW"] },
        district: { en: this.district?.en, "zh-TW": this.district?.["zh-TW"] },
        city: { en: this.city?.en, "zh-TW": this.city?.["zh-TW"] },
        state: { en: this.state?.en, "zh-TW": this.state?.["zh-TW"] },
        country: { en: this.country?.en, "zh-TW": this.country?.["zh-TW"] },
        postalCode: {
          en: this.postalCode?.en,
          "zh-TW": this.postalCode?.["zh-TW"],
        },
      };
      const formatted = formatAddress(addressData);
      this.formattedAddress = formatted;
      next();
    } catch (error) {
      if (error instanceof Error) {
        next(error);
      } else {
        next(new Error("Unknown error occurred while formatting address"));
      }
    }
  } else {
    next();
  }
});

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
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Ensure indexes for better query performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ "address.formattedAddress.en": 1 });
userSchema.index({ "address.formattedAddress.zh-TW": 1 });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;

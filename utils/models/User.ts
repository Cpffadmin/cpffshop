import mongoose from "mongoose";
import Product from "./Product";

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
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;

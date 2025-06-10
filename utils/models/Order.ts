import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    streetAddress: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    cartProducts: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "delivered", "cancelled"],
      default: "pending",
    },
    paid: {
      type: Boolean,
      default: false,
    },
    paymentProofUrl: {
      type: String,
    },
    paymentReference: {
      type: String,
    },
    rejectionReason: {
      type: String,
    },
    emailStatus: {
      sent: {
        type: Boolean,
        default: false,
      },
      messageId: String,
      error: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Order =
  mongoose.models?.Order || mongoose.model("Order", orderSchema);

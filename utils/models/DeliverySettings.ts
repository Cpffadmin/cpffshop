import mongoose from "mongoose";

const deliverySettingsSchema = new mongoose.Schema(
  {
    deliveryTypes: {
      local: {
        cost: { type: Number, required: true, default: 5 },
        name: { type: String, required: true, default: "Local Delivery" },
      },
      express: {
        cost: { type: Number, required: true, default: 10 },
        name: { type: String, required: true, default: "Express Delivery" },
      },
      overseas: {
        cost: { type: Number, required: true, default: 20 },
        name: { type: String, required: true, default: "Overseas Delivery" },
      },
    },
    freeDeliveryThreshold: {
      type: Number,
      required: true,
      default: 100,
    },
    bankAccountDetails: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const DeliverySettings =
  mongoose.models.DeliverySettings ||
  mongoose.model("DeliverySettings", deliverySettingsSchema);

export default DeliverySettings;

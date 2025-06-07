import mongoose from "mongoose";

const guaranteeSectionSchema = new mongoose.Schema(
  {
    title: {
      en: { type: String, required: false },
      "zh-TW": { type: String, required: false },
    },
    items: [
      {
        icon: {
          type: String,
          required: true,
        },
        title: {
          en: { type: String, required: true },
          "zh-TW": { type: String, required: true },
        },
        description: {
          en: { type: String, required: true },
          "zh-TW": { type: String, required: true },
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const GuaranteeSection =
  mongoose.models.GuaranteeSection ||
  mongoose.model("GuaranteeSection", guaranteeSectionSchema);

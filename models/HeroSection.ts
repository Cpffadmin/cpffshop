import mongoose from "mongoose";

const heroSectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    creditText: {
      type: String,
      default: "",
    },
    media: {
      type: {
        videoUrl: {
          type: String,
          default: "",
        },
        posterUrl: {
          type: String,
          default: "/images/placeholder-hero.jpg",
        },
        mediaType: {
          type: String,
          enum: ["video", "image"],
          default: "image",
        },
      },
      required: true,
      _id: false,
    },
    buttons: {
      primary: {
        text: {
          type: String,
          required: true,
        },
        link: {
          type: String,
          required: true,
        },
      },
      secondary: {
        text: {
          type: String,
          required: true,
        },
        link: {
          type: String,
          required: true,
        },
      },
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const HeroSection =
  mongoose.models.HeroSection ||
  mongoose.model("HeroSection", heroSectionSchema);

export default HeroSection;

import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema({
  images: [String],
});

const Gallery =
  mongoose.models.Gallery || mongoose.model("Gallery", gallerySchema);

export default Gallery;

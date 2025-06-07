export const useCloudinary = () => {
  return {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME || "",
  };
};

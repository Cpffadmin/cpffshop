"use client";

import { CloudinaryUploadWidgetResults } from "next-cloudinary";
import { createContext, useContext } from "react";

interface CloudinaryContextType {
  cloudName: string;
  uploadPreset: string;
  onUpload?: (result: CloudinaryUploadWidgetResults) => void;
}

const CloudinaryContext = createContext<CloudinaryContextType>({
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME || "",
});

export const useCloudinary = () => useContext(CloudinaryContext);

export function CloudinaryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CloudinaryContext.Provider
      value={{
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME || "",
      }}
    >
      {children}
    </CloudinaryContext.Provider>
  );
}

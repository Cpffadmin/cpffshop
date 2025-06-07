"use client";

import { useState } from "react";
import { uploadImage } from "@/utils/uploadImage";

interface SignedUploadButtonProps {
  onSuccess: (url: string) => void;
  onError?: (error: Error) => void;
  folder?: string;
  children?: React.ReactNode;
  className?: string;
  multiple?: boolean;
  maxFiles?: number;
  accept?: string;
}

export function SignedUploadButton({
  onSuccess,
  onError,
  folder = "general",
  children,
  className = "",
  multiple = false,
  maxFiles = 1,
  accept = "image/*",
}: SignedUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map((file) =>
        uploadImage(file, folder)
      );
      const results = await Promise.all(uploadPromises);
      results.forEach((result) => onSuccess(result.secure_url));
    } catch (error) {
      console.error("Upload error:", error);
      onError?.(error instanceof Error ? error : new Error("Upload failed"));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={className}>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        max={maxFiles}
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="w-full">
        {isUploading ? (
          <div className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg bg-gray-50">
            <div className="text-center">
              <p className="text-sm text-gray-500">Uploading...</p>
            </div>
          </div>
        ) : (
          children
        )}
      </label>
    </div>
  );
}

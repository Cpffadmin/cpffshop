interface UploadResponse {
  secure_url: string;
  public_id: string;
}

export async function uploadImage(
  file: File,
  folder: string = "general"
): Promise<UploadResponse> {
  try {
    // Get the timestamp
    const timestamp = Math.round(new Date().getTime() / 1000);

    // Get the signature from our API
    const signatureResponse = await fetch("/api/cloudinary/signature", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ timestamp, folder }),
    });

    if (!signatureResponse.ok) {
      throw new Error("Failed to get signature");
    }

    const { signature } = await signatureResponse.json();

    // Create form data
    const formData = new FormData();
    formData.append("file", file);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    formData.append("api_key", process.env.CLOUDINARY_API_KEY!);
    formData.append("folder", folder);
    formData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME!
    );

    // Upload to Cloudinary
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!uploadResponse.ok) {
      throw new Error("Upload failed");
    }

    const uploadResult = await uploadResponse.json();
    return {
      secure_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    };
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

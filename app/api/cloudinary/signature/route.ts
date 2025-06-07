import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export async function POST(request: Request) {
  try {
    const { timestamp, folder } = await request.json();

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        folder: folder,
        upload_preset: process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME,
      },
      process.env.CLOUDINARY_API_SECRET!
    );

    return NextResponse.json({ signature, timestamp });
  } catch (error) {
    console.error("Error generating signature:", error);
    return NextResponse.json(
      { error: "Failed to generate signature" },
      { status: 500 }
    );
  }
}

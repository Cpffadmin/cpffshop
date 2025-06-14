import connect from "@/utils/config/dbConnection";
import { NextResponse } from "next/server";
import User from "@/utils/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/auth.config";

export async function PUT(req: Request) {
  try {
    await connect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const { email, name, newEmail, phone, address } = await req.json();

    // Find and update the user
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    user.name = name;
    user.email = newEmail;
    user.phone = phone;
    user.address = address || {
      room: { en: "", "zh-TW": "" },
      floor: { en: "", "zh-TW": "" },
      building: { en: "", "zh-TW": "" },
      street: { en: "", "zh-TW": "" },
      city: { en: "", "zh-TW": "" },
      state: { en: "", "zh-TW": "" },
      country: { en: "", "zh-TW": "" },
      postalCode: { en: "", "zh-TW": "" },
      formattedAddress: { en: "", "zh-TW": "" },
    };
    await user.save(); // This triggers the pre-save hook!

    return NextResponse.json({
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Error updating user" },
      { status: 500 }
    );
  }
}

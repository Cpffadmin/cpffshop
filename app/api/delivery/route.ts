import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import DeliverySettings from "@/utils/models/DeliverySettings";
import { createRouteHandler } from "@/utils/routeHandler";
import "@/utils/models"; // Ensure models are registered

const handleDelivery = createRouteHandler();

export async function GET() {
  return handleDelivery(async () => {
    const settings = await DeliverySettings.findOne();

    if (!settings) {
      // Create default settings if none exist
      const defaultSettings = await DeliverySettings.create({});
      return defaultSettings;
    }

    return settings;
  });
}

export async function POST(request: Request) {
  return handleDelivery(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      throw new Error("Unauthorized");
    }

    const data = await request.json();

    const settings = await DeliverySettings.findOne();
    if (settings) {
      Object.assign(settings, data);
      await settings.save();
    } else {
      await DeliverySettings.create(data);
    }

    return { success: true };
  });
}

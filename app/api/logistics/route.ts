import { NextResponse } from "next/server";
import connect from "@/utils/config/dbConnection";
import { Logistics } from "@/utils/models/Logistics";
import { Order } from "@/utils/models/Order";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";

// GET - Fetch all logistics vehicles or filter by query params
export async function GET(req: Request) {
  try {
    await connect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.admin) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const location = searchParams.get("location");
    const status = searchParams.get("status");
    const bodyType = searchParams.get("bodyType");

    const query: Record<string, string> = {};
    if (location) query.assignedLocation = location;
    if (status) query.status = status;
    if (bodyType) query.bodyType = bodyType;

    // Get vehicles and populate orders in one query
    const vehicles = await Logistics.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: "assignedOrders.orderId",
        model: Order,
        select: "_id status total createdAt",
      });

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error("Error in logistics GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch logistics data" },
      { status: 500 }
    );
  }
}

// POST - Create a new logistics vehicle
export async function POST(req: Request) {
  try {
    await connect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.admin) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const data = await req.json();
    const vehicle = await Logistics.create(data);

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    console.error("Error in logistics POST:", error);
    return NextResponse.json(
      { error: "Failed to create logistics vehicle" },
      { status: 500 }
    );
  }
}

// PUT - Update a logistics vehicle
export async function PUT(req: Request) {
  try {
    await connect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.admin) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const data = await req.json();
    const { id, ...updateData } = data;

    const vehicle = await Logistics.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error("Error in logistics PUT:", error);
    return NextResponse.json(
      { error: "Failed to update logistics vehicle" },
      { status: 500 }
    );
  }
}

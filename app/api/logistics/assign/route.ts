import { NextResponse } from "next/server";
import connect from "@/utils/config/dbConnection";
import { Logistics } from "@/utils/models/Logistics";
import { Order } from "@/utils/models/Order";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";

type DeliveryStatus = "Pending" | "In Transit" | "Delivered" | "Failed";
type OrderStatus = "processing" | "delivered" | "cancelled";

const orderStatusMap: Record<DeliveryStatus, OrderStatus> = {
  Pending: "processing",
  "In Transit": "processing",
  Delivered: "delivered",
  Failed: "cancelled",
};

// GET - Check vehicle assignment for an order
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
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Find vehicle assigned to this order
    const vehicle = await Logistics.findOne({
      "assignedOrders.orderId": orderId,
    });

    return NextResponse.json({ vehicle });
  } catch (error) {
    console.error("Error in logistics assign GET:", error);
    return NextResponse.json(
      { error: "Failed to check vehicle assignment" },
      { status: 500 }
    );
  }
}

// POST - Assign vehicle to order
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

    const { vehicleId, orderId, scheduledDeliveryDate } = await req.json();

    if (!vehicleId || !orderId || !scheduledDeliveryDate) {
      return NextResponse.json(
        { error: "Vehicle ID, Order ID and delivery date are required" },
        { status: 400 }
      );
    }

    const vehicle = await Logistics.findById(vehicleId);

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // Check if vehicle is available
    if (vehicle.status !== "Available") {
      return NextResponse.json(
        { error: "Vehicle is not available for assignment" },
        { status: 400 }
      );
    }

    // Check if order is already assigned
    const existingAssignment = await Logistics.findOne({
      "assignedOrders.orderId": orderId,
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: "Order is already assigned to a vehicle" },
        { status: 400 }
      );
    }

    // Update vehicle with new assignment
    const updatedVehicle = await Logistics.findByIdAndUpdate(
      vehicleId,
      {
        $push: {
          assignedOrders: {
            orderId,
            assignedAt: new Date(),
            scheduledDeliveryDate: new Date(scheduledDeliveryDate),
            status: "Pending",
          },
        },
        $set: { status: "On Delivery" },
      },
      { new: true }
    );

    if (!updatedVehicle) {
      return NextResponse.json(
        { error: "Failed to update vehicle" },
        { status: 400 }
      );
    }

    // Update order status to reflect assignment
    await Order.findByIdAndUpdate(orderId, {
      $set: { status: "processing" },
    });

    return NextResponse.json(updatedVehicle);
  } catch (error) {
    console.error("Error in logistics assign POST:", error);
    return NextResponse.json(
      { error: "Failed to assign vehicle" },
      { status: 500 }
    );
  }
}

// Update assignment status
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

    const { vehicleId, orderId, status, deliveryNotes } = await req.json();

    if (!vehicleId || !orderId || !status) {
      return NextResponse.json(
        { error: "Vehicle ID, Order ID and status are required" },
        { status: 400 }
      );
    }

    // Update vehicle's assigned order status and vehicle status
    const updatedVehicle = await Logistics.findOneAndUpdate(
      {
        _id: vehicleId,
        "assignedOrders.orderId": orderId,
      },
      {
        $set: {
          "assignedOrders.$.status": status as DeliveryStatus,
          "assignedOrders.$.deliveryNotes": deliveryNotes || "",
          // Update vehicle status to Available if order is Delivered or Failed
          ...(status === "Delivered" || status === "Failed"
            ? { status: "Available" }
            : {}),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedVehicle) {
      return NextResponse.json(
        { error: "Vehicle or order assignment not found" },
        { status: 404 }
      );
    }

    // Update order status based on delivery status
    const deliveryStatus = status as DeliveryStatus;
    if (orderStatusMap[deliveryStatus]) {
      await Order.findByIdAndUpdate(
        orderId,
        {
          $set: {
            status: orderStatusMap[deliveryStatus],
          },
        },
        { runValidators: true }
      );
    }

    // Return populated vehicle data
    const populatedVehicle = await Logistics.findById(vehicleId).populate(
      "assignedOrders.orderId"
    );

    return NextResponse.json(populatedVehicle);
  } catch (error) {
    console.error("Error in logistics assign PUT:", error);
    return NextResponse.json(
      { error: "Failed to update assignment status" },
      { status: 500 }
    );
  }
}

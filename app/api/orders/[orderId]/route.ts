import { NextResponse } from "next/server";
import dbConnect from "@/utils/config/dbConnection";
import { Order } from "@/utils/models/Order";
import Product from "@/utils/models/Product";

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    await dbConnect();
    const { orderId } = await context.params;
    const order = await Order.findById(orderId).populate({
      path: "cartProducts.product",
      model: Product,
    });
    if (!order) {
      return NextResponse.json(
        { error: "Failed to fetch order" },
        { status: 404 }
      );
    }
    return NextResponse.json(order);
  } catch (error) {
    console.log("Error fetching order:", error);
    return NextResponse.json(
      { error: "Internal server error at api/order/[orderId]" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const { orderId } = params;

  await dbConnect();

  try {
    const body = await request.json();
    const { paymentProofUrl } = body;

    if (!paymentProofUrl) {
      return NextResponse.json(
        { error: "Payment proof URL is required" },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order with new payment proof and reset status to pending
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        paymentProofUrl,
        status: "pending",
        rejectionReason: null, // Clear the rejection reason
      },
      { new: true }
    ).populate({
      path: "cartProducts.product",
      model: Product,
    });

    return NextResponse.json({
      message: "Payment proof updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating payment proof:", error);
    return NextResponse.json(
      { error: "Failed to update payment proof" },
      { status: 500 }
    );
  }
}

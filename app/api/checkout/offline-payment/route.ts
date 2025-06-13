import { NextResponse } from "next/server";
import connect from "@/utils/config/dbConnection";
import { Order } from "@/utils/models/Order";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await connect();
    const body = await req.json();

    // Validate required fields
    const requiredFields = [
      "name",
      "email",
      "city",
      "postalCode",
      "streetAddress",
      "country",
      "paymentProofUrl",
      "paymentReference",
      "cartItems",
    ];
    const missingFields = requiredFields.filter((field) => !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Map cartItems to cartProducts structure required by the Order model
    const cartProducts = body.cartItems.map((item: any) => ({
      product: item.id,
      quantity: item.quantity,
      price: item.price,
    }));

    // Create the order with offline payment info
    const order = await Order.create({
      name: body.name,
      email: body.email,
      city: body.city,
      postalCode: body.postalCode,
      streetAddress: body.streetAddress,
      country: body.country,
      cartProducts,
      paid: false,
      status: "pending",
      paymentProofUrl: body.paymentProofUrl,
      paymentReference: body.paymentReference,
      paymentDate: body.paymentDate,
      user: session.user._id,
      deliveryType: body.deliveryType || undefined,
      total: cartProducts.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      ),
    });

    return NextResponse.json({ success: true, orderId: order._id });
  } catch (error) {
    console.error("Error creating offline payment order:", error);
    return NextResponse.json(
      { error: "Failed to submit offline payment" },
      { status: 500 }
    );
  }
}

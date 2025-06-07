import { NextResponse } from "next/server";
import { Order } from "@/utils/models/Order";
import dbConnect from "@/utils/config/dbConnection";
import Product from "@/utils/models/Product";

export async function POST(req: Request) {
  try {
    console.log("🎯 Webhook received");
    await dbConnect();
    const body = await req.text();
    console.log("📝 Raw webhook body:", body);
    const event = JSON.parse(body);
    console.log("🔍 Event type:", event.type);

    // Only handle successful checkouts
    if (event.type === "checkout.session.completed") {
      console.log("✅ Processing checkout.session.completed event");
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      console.log("📦 Order ID from metadata:", orderId);

      if (!orderId) {
        console.error("❌ No order ID found in session metadata");
        return NextResponse.json(
          { error: "No order ID in metadata" },
          { status: 400 }
        );
      }

      // Find the order and get its products
      const order = await Order.findById(orderId);
      if (!order) {
        console.error("❌ Order not found");
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      // Update stock for each product in the order
      for (const item of order.cartProducts) {
        const product = await Product.findById(item.product);
        if (product) {
          const newStock = Math.max(0, product.stock - item.quantity);
          await Product.findByIdAndUpdate(item.product, { stock: newStock });
          console.log(
            `📦 Updated stock for product ${product.name}: ${product.stock} -> ${newStock}`
          );
        }
      }

      // Update the order status
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
          paid: true,
          status: "processing",
        },
        { new: true }
      );

      console.log("🔄 Updated order:", updatedOrder);

      if (!updatedOrder) {
        console.error("❌ Failed to update order");
        return NextResponse.json(
          { error: "Failed to update order" },
          { status: 400 }
        );
      }

      console.log("✨ Order successfully updated");
      return NextResponse.json({ success: true });
    }

    console.log("➡️ Event type not handled:", event.type);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

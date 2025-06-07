import { NextResponse } from "next/server";
import connect from "@/utils/config/dbConnection";
import { Order } from "@/utils/models/Order";
import Product from "@/utils/models/Product";
import { sendEmail } from "@/lib/emailService";

export async function GET(req: Request) {
  await connect();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "5");
  const status = searchParams.get("status");
  const language = searchParams.get("language") || "en";

  const skip = (page - 1) * limit;

  try {
    // Build query based on status filter
    const query = status ? { status } : {};

    const orders = await Order.find(query)
      .populate({
        path: "cartProducts.product",
        model: Product,
        select:
          language === "zh-TW"
            ? "name_zh images price description_zh"
            : "name images price description",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments(query);

    const hasMore = totalOrders > skip + orders.length;

    return NextResponse.json({
      orders,
      hasMore,
      totalOrders,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Failed to fetch orders", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  await connect();

  try {
    const { orderId, confirmPayment, rejectPayment, rejectionReason } =
      await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "no orderid" }, { status: 400 });
    }

    let updateFields: any = {};
    if (confirmPayment) {
      updateFields = { paid: true, status: "processing" };

      // Get the order to update stock
      const order = await Order.findById(orderId).populate({
        path: "cartProducts.product",
        model: Product,
      });

      if (!order) {
        return NextResponse.json({ error: "order not found" }, { status: 404 });
      }

      // Update stock for each product in the order
      for (const item of order.cartProducts) {
        const product = await Product.findById(item.product._id);
        if (product) {
          const newStock = Math.max(0, product.stock - item.quantity);
          await Product.findByIdAndUpdate(item.product._id, {
            stock: newStock,
          });
          console.log(
            `Updated stock for product ${product.name}: ${product.stock} -> ${newStock}`
          );
        }
      }
    } else if (rejectPayment) {
      updateFields = {
        status: "cancelled",
        rejectionReason: rejectionReason || "Payment proof rejected",
      };
    } else {
      updateFields = { status: "delivered" };
    }

    const updatedOrder = await Order.findByIdAndUpdate(orderId, updateFields, {
      new: true,
    }).populate({
      path: "cartProducts.product",
      model: Product,
    });

    if (!updatedOrder) {
      return NextResponse.json({ error: "order not found" }, { status: 404 });
    }

    // Send email notifications
    try {
      if (confirmPayment) {
        await sendEmail({
          to: updatedOrder.email,
          subject: "Payment Confirmed - Order Processing",
          text: `Dear ${updatedOrder.name},\n\nYour payment for order #${updatedOrder._id} has been confirmed. We are now processing your order.\n\nThank you for your purchase!`,
          html: `
            <h1>Payment Confirmed</h1>
            <p>Dear ${updatedOrder.name},</p>
            <p>Your payment for order #${updatedOrder._id} has been confirmed.</p>
            <p>We are now processing your order.</p>
            <p>Thank you for your purchase!</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/profile?tab=orders">Track Your Order</a></p>
          `,
        });
      } else if (rejectPayment) {
        await sendEmail({
          to: updatedOrder.email,
          subject: "Action Required: Payment Rejected",
          text: `Dear ${updatedOrder.name},\n\nYour payment proof for order #${updatedOrder._id} has been rejected.\n\nReason: ${rejectionReason}\n\nPlease submit a new payment proof through your order dashboard.\n\nIf you have any questions, please contact our support team.`,
          html: `
            <h1>Payment Rejected</h1>
            <p>Dear ${updatedOrder.name},</p>
            <p>Your payment proof for order #${updatedOrder._id} has been rejected.</p>
            <p><strong>Reason:</strong> ${rejectionReason}</p>
            <p>Please submit a new payment proof through your order dashboard.</p>
            <p>If you have any questions, please contact our support team.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/profile?tab=orders">Submit New Payment Proof</a></p>
          `,
        });
      }
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError);
      // Don't return error here, as the order update was successful
    }

    return NextResponse.json({
      message: confirmPayment
        ? "order payment confirmed and status set to processing"
        : rejectPayment
        ? "order payment rejected and status set to cancelled"
        : "order status is updated to delivered",
      order: updatedOrder,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "failed to update order status", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  await connect();

  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Order deleted successfully",
      orderId: deletedOrder._id,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Failed to delete order", details: errorMessage },
      { status: 500 }
    );
  }
}

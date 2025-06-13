import { NextResponse } from "next/server";
import connect from "@/utils/config/dbConnection";
import { Order } from "@/utils/models/Order";
import Product from "@/utils/models/Product";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

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

    // Validate Stripe key
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("Missing Stripe secret key");
      return NextResponse.json(
        { error: "Stripe configuration error" },
        { status: 500 }
      );
    }

    // Validate public URL
    if (!process.env.NEXT_PUBLIC_URL) {
      console.error("Missing NEXT_PUBLIC_URL");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    console.log("Starting checkout process");
    await connect();
    console.log("Database connected");

    const body = await req.json();
    console.log("Received body:", body);

    // Validate required fields
    const requiredFields = [
      "name",
      "email",
      "city",
      "postalCode",
      "streetAddress",
      "country",
      "cartItems",
    ];
    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    const { name, email, city, postalCode, streetAddress, country, cartItems } =
      body;

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    console.log("Cart items:", cartItems);

    const productIds = cartItems.map((item: { id: string }) => item.id);
    const uniqueIds = Array.from(new Set(productIds));
    console.log("Unique product IDs:", uniqueIds);

    let productsInfos;
    try {
      productsInfos = await Product.find({ _id: { $in: uniqueIds } });
      console.log("Found products:", productsInfos);
    } catch (error) {
      console.error("Error fetching products:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return NextResponse.json(
        { error: "Error fetching products", details: errorMessage },
        { status: 500 }
      );
    }

    if (!productsInfos || productsInfos.length === 0) {
      return NextResponse.json({ error: "No products found" }, { status: 400 });
    }

    const line_items = [];
    let total = 0;
    const orderCartProducts = [];

    for (const cartItem of cartItems) {
      console.log("Processing cart item:", cartItem);
      const productInfo = productsInfos.find(
        (p) => p._id.toString() === cartItem.id
      );

      if (productInfo) {
        console.log("Found product info:", productInfo);
        const quantity = cartItem.quantity || 0;
        if (quantity > 0) {
          total += productInfo.price * quantity;
          line_items.push({
            price_data: {
              currency: "usd",
              product_data: {
                name: productInfo.name,
              },
              unit_amount: Math.round(productInfo.price * 100),
            },
            quantity: quantity,
          });
          orderCartProducts.push({
            product: {
              _id: productInfo._id,
              name: productInfo.name,
              description: productInfo.description,
              images: productInfo.images,
              price: productInfo.price,
            },
            quantity: quantity,
            price: productInfo.price,
          });
        }
      } else {
        console.log("Product not found for ID:", cartItem.id);
      }
    }

    console.log("Line items:", line_items);
    console.log("Total:", total);

    // Create the order
    let orderDoc;
    try {
      orderDoc = await Order.create({
        name,
        email,
        city,
        postalCode,
        streetAddress,
        country,
        paid: false,
        cartProducts: orderCartProducts,
        total,
        user: session.user._id,
        status: "pending",
      });
      console.log("Order created:", orderDoc);
    } catch (error) {
      console.error("Error creating order:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return NextResponse.json(
        { error: "Error creating order", details: errorMessage },
        { status: 500 }
      );
    }

    // Create Stripe checkout session
    let stripeSession;
    try {
      stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items,
        mode: "payment",
        success_url: `${process.env.NEXT_PUBLIC_URL}/checkout/success?orderId=${orderDoc._id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL}/checkout/canceled`,
        metadata: {
          orderId: orderDoc._id.toString(),
        },
        customer_email: email,
      });
      console.log("Stripe session created:", stripeSession.id);
    } catch (error) {
      console.error("Error creating Stripe session:", error);
      // Delete the order if Stripe session creation fails
      if (orderDoc) {
        try {
          await Order.findByIdAndDelete(orderDoc._id);
        } catch (deleteError) {
          console.error(
            "Error deleting order after failed Stripe session:",
            deleteError
          );
        }
      }
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return NextResponse.json(
        { error: "Error creating Stripe session", details: errorMessage },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        url: stripeSession.url,
        sessionId: stripeSession.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Checkout error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: errorMessage,
        stack:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.stack
              : undefined
            : undefined,
      },
      { status: 500 }
    );
  }
}

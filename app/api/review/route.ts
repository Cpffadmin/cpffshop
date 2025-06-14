/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import connect from "@/utils/config/dbConnection";
import Review from "@/utils/models/Review";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Order } from "@/utils/models/Order";
import mongoose from "mongoose";
import Product from "@/utils/models/Product";
import { authOptions } from "../auth/[...nextauth]/auth.config";
import { clearProductsCache } from "../products/route";

export async function POST(req: Request) {
  try {
    await connect();

    const session = await getServerSession(authOptions);

    if (!session) {
      console.log("No session found");
      return NextResponse.json({ canReview: false }, { status: 200 });
    }

    const { productId, rating, comment, image } = await req.json();
    console.log("Received POST data:", { productId, rating, comment, image });
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.log("Invalid productId:", productId);
      return NextResponse.json(
        { error: "invalid product id" },
        { status: 400 }
      );
    }

    const objectIdProductId = new mongoose.Types.ObjectId(productId);

    const hasPurchased = await Order.findOne({
      user: session.user._id,
      "cartProducts.product": objectIdProductId,
      status: "delivered",
      paid: true,
    });
    console.log("Order found for review?", !!hasPurchased);

    if (!hasPurchased) {
      console.log(
        "User has not purchased the product or order not delivered/paid"
      );
      return NextResponse.json({ canReview: false }, { status: 200 });
    }

    const existingReview = await Review.findOne({
      user: session.user._id,
      product: objectIdProductId,
    });
    console.log("Existing review found?", !!existingReview);

    if (existingReview) {
      console.log("User has already reviewed this product");
      return NextResponse.json(
        { error: "you have already reviewed this" },
        { status: 400 }
      );
    }

    const newReview = new Review({
      user: session.user._id,
      product: objectIdProductId,
      rating,
      comment,
      image,
    });
    await newReview.save();
    console.log("New review saved:", newReview);

    const product = await Product.findById(objectIdProductId);

    if (!product) {
      console.log("Product not found for review");
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Ensure reviews is always an array
    if (!Array.isArray(product.reviews)) {
      product.reviews = [];
    }
    product.reviews.push(newReview._id);
    const allReviews = await Review.find({ product: objectIdProductId });
    product.numReviews = allReviews.length;
    const totalRating = allReviews.reduce((acc, item) => item.rating + acc, 0);
    const avgRating =
      allReviews.length > 0 ? totalRating / allReviews.length : 0;
    product.averageRating = avgRating;

    await product.save();
    console.log("Product updated with new review");
    clearProductsCache();

    const populatedReview = await Review.findById(newReview._id).populate(
      "user",
      "name profileImage"
    );
    return NextResponse.json(
      {
        message: "Review added successfully",
        review: populatedReview,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in review POST:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error at the review api route",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    await connect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ canReview: false }, { status: 200 });
    }

    const { reviewId, rating, comment } = await req.json();

    const review = await Review.findOne({
      _id: reviewId,
      user: session.user._id,
    });

    if (!review) {
      return NextResponse.json(
        { error: "failed to find review" },
        { status: 404 }
      );
    }

    review.rating = rating;
    review.comment = comment;
    await review.save();

    const product = await Product.findById(review.product);
    const allReviews = await Review.find({ product: review.product });
    const avgRating =
      allReviews.reduce((acc, item) => item.rating + acc, 0) /
      allReviews.length;
    product.averageRating = avgRating;
    await product.save();
    clearProductsCache();

    return NextResponse.json({ message: "Review updated" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "internal server error at the review api route main" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    await connect();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "5");
    if (!productId) {
      return NextResponse.json(
        { error: "prod id is required" },
        { status: 400 }
      );
    }
    const skip = (page - 1) * limit;
    const reviews = await Review.find({ product: productId })
      .populate("user", "name profileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ product: productId });
    const hasMore = total > skip + reviews.length;

    return NextResponse.json({ reviews, hasMore }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "internal server error at the review api route main" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    await connect();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ canReview: false }, { status: 200 });
    }
    let reviewId;
    // Try to get reviewId from body (for axios) or query string (for fetch)
    try {
      const body = await req.json();
      reviewId = body.reviewId;
    } catch {
      const { searchParams } = new URL(req.url);
      reviewId = searchParams.get("reviewId");
    }
    if (!reviewId) {
      return NextResponse.json(
        { error: "reviewId is required" },
        { status: 400 }
      );
    }
    const review = await Review.findOne({
      _id: reviewId,
      user: session.user._id,
    });
    if (!review) {
      return NextResponse.json(
        { error: "failed to get review" },
        { status: 404 }
      );
    }
    const productId = review.product;
    await Review.deleteOne({ _id: reviewId });
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    // Ensure reviews is always an array
    if (!Array.isArray(product.reviews)) {
      product.reviews = [];
    }
    product.reviews = product.reviews.filter(
      (r: mongoose.Types.ObjectId) => r.toString() !== reviewId
    );
    const allReviews = await Review.find({ product: productId });
    product.numReviews = allReviews.length;
    if (product.numReviews > 0) {
      const avgRating =
        allReviews.reduce((acc, item) => item.rating + acc, 0) /
        allReviews.length;
      product.averageRating = avgRating;
    } else {
      product.averageRating = 0;
    }
    await product.save();
    clearProductsCache();
    return NextResponse.json(
      { message: "Successfully deleted review" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in review DELETE:", error);
    return NextResponse.json(
      {
        error:
          error.message || "Internal server error at the review api route main",
      },
      { status: 500 }
    );
  }
}

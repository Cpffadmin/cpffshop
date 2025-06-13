import mongoose from "mongoose";
import Product from "@/utils/models/Product";
import Review from "@/utils/models/Review";
import dbConnect from "@/utils/config/dbConnection";

async function recalculateProductRatings() {
  await dbConnect();
  const products = await Product.find({});
  let updatedCount = 0;

  for (const product of products) {
    const reviews = await Review.find({ product: product._id });
    const numReviews = reviews.length;
    const averageRating =
      numReviews > 0
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / numReviews
        : 0;
    product.numReviews = numReviews;
    product.averageRating = averageRating;
    await product.save();
    updatedCount++;
    console.log(
      `Updated product ${
        product._id
      }: numReviews=${numReviews}, averageRating=${averageRating.toFixed(2)}`
    );
  }
  console.log(`\nDone. Updated ${updatedCount} products.`);
  mongoose.connection.close();
}

recalculateProductRatings().catch((err) => {
  console.error("Error recalculating product ratings:", err);
  mongoose.connection.close();
});

import React, { useEffect, useState } from "react";
import { Star } from "lucide-react";
import axios from "axios";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Image from "next/image";

interface Review {
  _id: string;
  userId: {
    name: string;
    image?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

interface Props {
  productId: string;
  averageRating: number;
  allReviews: { rating: number }[];
}

const ReviewSection = ({ productId, averageRating, allReviews }: Props) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const { data: session } = useSession();

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data } = await axios.get(`/api/review?productId=${productId}`);
        setReviews(data.reviews);
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      }
    };

    fetchReviews();
  }, [productId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error("Please login to submit a review");
      return;
    }

    try {
      const { data } = await axios.post(`/api/review`, {
        ...newReview,
        productId,
      });
      setReviews([...reviews, data.review]);
      setNewReview({ rating: 5, comment: "" });
      toast.success("Review submitted successfully!");
    } catch (err) {
      console.error("Failed to submit review:", err);
      toast.error("Failed to submit review");
    }
  };

  return (
    <section className="bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 py-4 mt-2 rounded-lg overflow-hidden relative shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="container mx-auto px-4">
        <h2 className="text-xl font-bold text-center mb-4 text-slate-800 dark:text-slate-100 hover:text-slate-900 dark:hover:text-white transition-colors">
          Customer Reviews
        </h2>
        <div className="text-center mb-8 transform hover:scale-105 transition-transform duration-300">
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {averageRating.toFixed(1)} / 5.0
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            Based on {allReviews.length} reviews
          </div>
        </div>

        {/* Review Form */}
        {session && (
          <form
            onSubmit={handleSubmitReview}
            className="max-w-m mx-auto mb-12 transition-transform duration-300 hover:scale-[1.01]"
          >
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2 hover:text-gray-800 dark:hover:text-white transition-colors">
                  Rating
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setNewReview({ ...newReview, rating: star })
                      }
                      className="focus:outline-none transform hover:scale-110 transition-transform duration-200"
                    >
                      <Star
                        className={`w-6 h-6 transition-colors duration-200 ${
                          star <= newReview.rating
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2 hover:text-gray-800 dark:hover:text-white transition-colors">
                  Your Review
                </label>
                <textarea
                  value={newReview.comment}
                  onChange={(e) =>
                    setNewReview({ ...newReview, comment: e.target.value })
                  }
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={4}
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-md"
              >
                Submit Review
              </button>
            </div>
          </form>
        )}

        {/* Reviews List */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 max-w-xl mx-auto sm:px-4">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center mb-4 gap-3">
                <div className="flex-shrink-0 transform hover:scale-105 transition-transform duration-200">
                  <Image
                    src={review.userId.image || "/profile.jpg"}
                    alt={review.userId.name}
                    width={40}
                    height={40}
                    className="rounded-full ring-2 ring-gray-100 dark:ring-gray-700 hover:ring-gray-200 dark:hover:ring-gray-600 transition-all"
                  />
                </div>
                <div className="ml-4 flex-grow">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                    {review.userId.name}
                  </h4>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 transition-colors duration-200 ${
                          i < review.rating
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300 dark:text-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-auto">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 transition-colors leading-relaxed">
                {review.comment}
              </p>
            </div>
          ))}
        </div>

        {reviews.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 mt-8 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            No reviews yet. Be the first to review this product!
          </p>
        )}
      </div>
    </section>
  );
};

export default ReviewSection;

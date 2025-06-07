import React from "react";
import { ShoppingCart, Heart } from "lucide-react";

interface ProdDetailsPriceProps {
  product: {
    name: string;
    price: number;
    originalPrice?: number;
    description: string;
    stock: number;
  };
  averageRating: number;
  allReviews?: { rating: number }[];
  isInWishlist: boolean;
  handleAddToCart: (e: React.MouseEvent<HTMLButtonElement>) => void;
  toggleWishlist: (e: React.MouseEvent<HTMLButtonElement>) => void;
  session?: any;
}

const ProdDetailsPrice = ({
  product,
  averageRating,
  allReviews,
  isInWishlist,
  handleAddToCart,
  toggleWishlist,
  session,
}: ProdDetailsPriceProps) => {
  return (
    <div className="md:w-1/2 px-4 sm:px-8 pb-8 sm:pt-20">
      <div className="relative overflow-hidden bg-card rounded-t-xl shadow-lg p-4 sm:p-8 mb-8 hover:shadow-2xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -left-4 w-40 h-40 bg-secondary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-40 h-40 bg-accent/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

        <div className="relative z-10 transform-gpu">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-foreground antialiased">
            <span className="bg-clip-text text-foreground">{product.name}</span>
          </h1>

          <div className="flex items-center flex-wrap mb-6">
            <p className="text-xl sm:text-2xl font-semibold text-primary mr-2 sm:mr-4 antialiased">
              ${product.price.toFixed(2)}
            </p>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <p className="text-lg sm:text-xl text-muted-foreground line-through mr-2 sm:mr-4 antialiased">
                  ${product.originalPrice.toFixed(2)}
                </p>
                <span className="px-2 py-1 text-xs sm:text-sm font-semibold bg-primary/20 text-primary rounded-full antialiased">
                  {Math.round(
                    ((product.originalPrice - product.price) /
                      product.originalPrice) *
                      100
                  )}
                  % OFF
                </span>
              </>
            )}
            {session?.user?.admin && (
              <div className="ml-4 text-sm text-muted-foreground">
                <span className="font-semibold">Stock:</span> {product.stock}
              </div>
            )}
            <span className="px-3 hidden sm:block py-1 text-sm font-semibold bg-primary/20 text-primary rounded-full antialiased ml-auto">
              In Stock
            </span>
          </div>
          <span className="px-3 sm:hidden py-1 text-sm font-semibold bg-primary/20 text-primary rounded-full antialiased ml-auto">
            In Stock
          </span>
          <p className="mb-6 mt-6 text-sm sm:mt-0 text-muted-foreground leading-relaxed bg-muted/50 rounded-lg p-4 shadow-inner backdrop-filter backdrop-blur-sm antialiased max-h-[20rem] overflow-auto">
            {product.description}
          </p>
          <div className="flex space-x-2 sm:space-x-4 mt-4">
            <div className="flex items-center text-xs sm:text-base">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-primary"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
              <span className="ml-1 text-muted-foreground antialiased">
                {averageRating.toFixed(1)} ({allReviews ? allReviews.length : 0}{" "}
                reviews)
              </span>
            </div>
            <div className="flex items-center text-xs sm:text-base">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
              <span className="ml-1 text-muted-foreground antialiased">
                Verified Product
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={handleAddToCart}
          className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-md hover:bg-primary/90 transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 flex items-center justify-center"
        >
          <ShoppingCart className="mr-2 h-5 w-5 animate-bounce" />
          <span className="font-semibold">Add to Cart</span>
        </button>
        <button
          onClick={toggleWishlist}
          className={`
            p-3 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50
            ${
              isInWishlist
                ? "bg-destructive text-destructive-foreground focus:ring-destructive"
                : "bg-muted text-muted-foreground hover:bg-muted/80 focus:ring-muted"
            }
          `}
        >
          <Heart
            className={`h-6 w-6 transform transition-transform duration-800 ${
              isInWishlist ? "fill-current animate-pulse" : "hover:scale-110"
            }`}
          />
        </button>
      </div>
    </div>
  );
};

export default ProdDetailsPrice;

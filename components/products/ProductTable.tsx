import { Product } from "@/types";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Edit, Star, ShoppingCart } from "lucide-react";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useCart } from "@/providers/cart/CartContext";
import { useCartUI } from "@/components/ui/CartUIContext";
import { WishlistButton } from "@/components/ui/WishlistButton";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

interface ProductTableProps {
  products: Product[];
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({
  products,
  isLoading = false,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const { data: session } = useSession();
  const { language, t } = useTranslation();
  const { addItem } = useCart();
  const { openCart } = useCartUI();

  const handleAddToCart = (product: Product) => {
    addItem(product);
    openCart();
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <LoadingSkeleton key={i} height="h-16" className="rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            {products.map((product) => (
              <tr
                key={product._id}
                className="border-b border-border hover:bg-accent/5"
              >
                <td className="p-4">
                  <div className="relative h-16 w-16">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <Link href={`/product/${product._id}`}>
                      <span className="font-medium hover:text-primary block mb-2 sm:mb-0">
                        {product.displayNames?.[language] || product.name}
                      </span>
                    </Link>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span className="font-medium">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.originalPrice &&
                        product.originalPrice > product.price && (
                          <span className="text-sm text-muted-foreground line-through">
                            ${product.originalPrice.toFixed(2)}
                          </span>
                        )}
                    </div>
                  </div>
                </td>
                <td className="hidden sm:table-cell p-4">
                  <div className="flex items-center">
                    {product.averageRating && product.averageRating > 0 ? (
                      <>
                        <Star className="w-4 h-4 text-primary fill-primary" />
                        <span className="ml-1">
                          {product.averageRating.toFixed(1)} (
                          {product.numReviews})
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {t("common.noRatingsYet")}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="text-sm px-3 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <span className="hidden sm:inline">
                        {t("product.addToCart")}
                      </span>
                      <ShoppingCart className="w-5 h-5 sm:hidden" />
                    </button>
                    <WishlistButton productId={product._id} variant="icon" />
                    {session?.user?.admin && (
                      <Link href={`/admin/editProduct/${product._id}`}>
                        <Edit className="w-5 h-5 text-muted-foreground hover:text-primary" />
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {onPageChange && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-md border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-md border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductTable;

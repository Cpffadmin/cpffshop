"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircleIcon,
  TruckIcon,
  CalendarIcon,
  CreditCardIcon,
  EnvelopeIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { ShoppingBag, ClipboardList, Upload } from "lucide-react";
import { Order } from "@/types";
import { fetchOrder } from "./api";
import { formatDate, formatPrice } from "./utils";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useSession } from "next-auth/react";
import { ProductImage } from "@/components/ui/ProductImage";
import { useTranslation } from "@/providers/language/LanguageContext";
import Image from "next/image";
import axios from "axios";
import { CldUploadButton } from "next-cloudinary";
import { useCloudinary } from "@/components/providers/CloudinaryProvider";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import useCartStore from "@/store/cartStore";
import { useParams } from "next/navigation";

interface PageParams {
  params: {
    orderId: string;
  };
}

const OrderDetails = () => {
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLightbox, setShowLightbox] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();
  const { t } = useTranslation();
  const { cloudName, uploadPreset } = useCloudinary();
  const clearCart = useCartStore((state) => state.clearCart);

  // Function to format order ID to 12-digit format
  const formatOrderId = (id: string) => {
    if (!id) return "N/A";
    return id.slice(-12).toUpperCase();
  };

  const breadcrumbItems = [
    {
      label: session?.user?.admin
        ? t("navigation.adminPanel")
        : t("navigation.profile"),
      href: session?.user?.admin ? "/admin" : "/profile",
      icon: session?.user?.admin ? ClipboardList : ShoppingBag,
    },
    {
      label: t("navigation.orders"),
      href: session?.user?.admin ? "/admin/orders" : "/profile?tab=orders",
      icon: ShoppingBag,
    },
    {
      label: t("orders.orderNumber", { id: formatOrderId(orderId) }),
      href: `/orders/${orderId}`,
      icon: ShoppingBag,
    },
  ];

  const getOrder = useCallback(async () => {
    try {
      const data = await fetchOrder(orderId);
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch order");
      console.error("Error fetching order:", err);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    getOrder();
  }, [getOrder]);

  useEffect(() => {
    if (order?.paid) {
      // Clear cart if order is paid
      clearCart();
    }
  }, [order, clearCart]);

  const handlePaymentProofUpload = async (result: any) => {
    if (
      !result.info ||
      typeof result.info !== "object" ||
      !("secure_url" in result.info)
    ) {
      toast.error("Upload failed. Please try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.put(`/api/orders/${orderId}`, {
        paymentProofUrl: result.info.secure_url,
        status: "pending",
      });

      toast.success("Payment proof uploaded successfully!");
      getOrder(); // Refresh order data
    } catch (error) {
      toast.error("Failed to update order with new payment proof");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignmentComplete = () => {
    // Refresh order data after vehicle assignment
    getOrder();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  if (!order) {
    return <div className="text-center mt-8">Order Not Found</div>;
  }

  const showResubmitSection =
    order.status === "cancelled" && order.rejectionReason;

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-3xl mx-auto">
        <Breadcrumb items={breadcrumbItems} />
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden transition-colors duration-200">
          <div className="bg-gradient-to-r from-[#535C91] to-[#424874] dark:from-[#6B74A9] dark:to-[#535C91] px-6 py-4">
            <h1 className="text-3xl font-bold text-white">Order Summary</h1>
            <p className="text-xl text-yellow-500 font-mono mt-1">
              Order #{formatOrderId(orderId)}
            </p>
            <p className="text-indigo-100">Thank you for your purchase!</p>
          </div>

          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
              <div className="flex items-center">
                <CalendarIcon className="h-6 w-6 text-gray-400 dark:text-gray-500 mr-2" />
                <span className="text-gray-600 dark:text-gray-300">
                  Order Date: {formatDate(order.createdAt)}
                </span>
              </div>
              <div className="flex items-center">
                <CreditCardIcon className="h-6 w-6 text-gray-400 dark:text-gray-500 mr-2" />
                <span className="text-gray-600 dark:text-gray-300">
                  Payment Status: {order.paid ? "Paid" : "Pending"}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Customer Information
              </h2>
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {order.email}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Order Items
              </h2>
              <div className="space-y-4">
                {order.cartProducts.map((item, index) => (
                  <div
                    key={item.product?._id + index || index}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="relative w-16 h-16">
                        <ProductImage
                          src={item.product?.images?.[0]}
                          alt={item.product?.name}
                          sizes="(max-width: 64px) 100vw, 64px"
                          priority={true}
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {item.product?.name || "Product Name Unavailable"}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          {item.product?.description?.slice(0, 50) + "..." ||
                            "No description available"}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Quantity: {item.quantity || 1}
                        </p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                      ${formatPrice(item.price * (item.quantity || 1))}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Total
                </span>
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  ${formatPrice(order.total)}
                </span>
              </div>
            </div>

            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Shipping Information
              </h2>
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Name:</span> {order.name}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Address:</span>{" "}
                  {order.streetAddress}, {order.city}, {order.postalCode}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Country:</span> {order.country}
                </p>
              </div>
            </div>

            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Payment Information
              </h2>
              {order.paymentProofUrl && (
                <div className="mb-4">
                  <strong>Payment Proof:</strong>
                  <button
                    className="block mt-2 focus:outline-none"
                    onClick={() => setShowLightbox(true)}
                    aria-label="Open payment proof image"
                  >
                    <Image
                      src={order.paymentProofUrl}
                      alt="Payment Proof"
                      width={320}
                      height={160}
                      className="max-h-32 rounded shadow border cursor-pointer"
                      unoptimized
                    />
                  </button>
                  {showLightbox && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
                      <div className="relative">
                        <button
                          className="absolute top-2 right-2 bg-white rounded-full p-2 shadow hover:bg-gray-200"
                          onClick={() => setShowLightbox(false)}
                          aria-label="Close payment proof lightbox"
                        >
                          <span className="text-3xl font-extrabold text-black">
                            &times;
                          </span>
                        </button>
                        <Image
                          src={order.paymentProofUrl}
                          alt="Payment Proof Large"
                          width={800}
                          height={600}
                          className="rounded shadow-lg max-w-[90vw] max-h-[80vh]"
                          unoptimized
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              {order.paymentReference && (
                <div className="mb-4">
                  <strong>Payment Reference:</strong> {order.paymentReference}
                </div>
              )}
            </div>

            {showResubmitSection && (
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-4">
                  <div className="flex items-start">
                    <XCircleIcon className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                        Payment Rejected
                      </h3>
                      <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                        Reason: {order.rejectionReason}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Resubmit Payment Proof
                  </h3>
                  <div className="space-y-4">
                    <CldUploadButton
                      uploadPreset={
                        process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME
                      }
                      onSuccess={handlePaymentProofUpload}
                      options={{
                        cloudName:
                          process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
                        maxFiles: 1,
                        sources: ["local", "url", "camera"],
                        clientAllowedFormats: [
                          "jpg",
                          "jpeg",
                          "png",
                          "webp",
                          "pdf",
                        ],
                        maxFileSize: 10 * 1024 * 1024,
                        multiple: false,
                        folder: "payment-proofs",
                      }}
                    >
                      <Button
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 bg-[#535C91] hover:bg-[#424874] text-white"
                      >
                        <Upload className="w-4 h-4" />
                        {isSubmitting
                          ? "Uploading..."
                          : "Upload New Payment Proof"}
                      </Button>
                    </CldUploadButton>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Please upload a clear image or PDF of your payment proof.
                      Supported formats: JPG, PNG, PDF. Max size: 10MB.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center">
                <TruckIcon className="h-6 w-6 text-indigo-500 dark:text-indigo-400 mr-2" />
                <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Order Status: {order.status}
                </span>
              </div>
              <div className="mt-4 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Your order is: {order.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Last updated: {formatDate(order.updatedAt)}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 mt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              If you have any questions about your order, please contact our
              customer support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;

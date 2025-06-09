"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  CheckCircle,
  Trash2,
  Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { useTranslation } from "@/providers/language/LanguageContext";
import Image from "next/image";
import VehicleAssignment from "@/components/logistics/VehicleAssignment";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import useCartStore from "@/store/cartStore";

interface SessionUser {
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

interface OrderProduct {
  product: {
    _id: string;
    name: string;
    price: number;
  };
  quantity: number;
}

interface Order {
  _id: string;
  name: string;
  email: string;
  city: string;
  postalCode: string;
  streetAddress: string;
  country: string;
  total: number;
  status: string;
  createdAt: string;
  cartProducts: OrderProduct[];
  paymentProofUrl?: string;
  paymentReference?: string;
  paid?: boolean;
}

interface Props {
  filterStatus?: string;
}

const OrdersSkeleton = () => {
  return (
    <div className="space-y-4 p-4">
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 sm:p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <LoadingSkeleton height="h-6" width="w-48" />
            <div className="flex items-center gap-4">
              <LoadingSkeleton height="h-6" width="w-24" />
              <div className="flex gap-2">
                <LoadingSkeleton height="h-8" width="w-24" />
                <LoadingSkeleton height="h-8" width="w-24" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <LoadingSkeleton height="h-4" width="w-32" />
              <LoadingSkeleton height="h-4" width="w-24" />
            </div>
            <div className="flex justify-between">
              <LoadingSkeleton height="h-4" width="w-40" />
              <LoadingSkeleton height="h-4" width="w-20" />
            </div>
            <div className="flex justify-between">
              <LoadingSkeleton height="h-4" width="w-36" />
              <LoadingSkeleton height="h-4" width="w-28" />
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <LoadingSkeleton height="h-4" width="w-32" />
            <div className="flex gap-2">
              <LoadingSkeleton height="h-8" width="w-8" />
              <LoadingSkeleton height="h-8" width="w-8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const Orders = ({ filterStatus }: Props) => {
  const { data: session, status } = useSession() as {
    data: SessionUser | null;
    status: "loading" | "authenticated" | "unauthenticated";
  };
  const router = useRouter();
  const { t, language } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState(filterStatus || "all");
  const limit = 5;
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `/api/orderAdmin?page=${page}&limit=${limit}${
            selectedStatus !== "all" ? `&status=${selectedStatus}` : ""
          }&language=${language}`
        );
        console.log(res.data);
        console.log(Math.ceil(totalOrders / limit));

        setOrders(res.data.orders);
        setHasMore(res.data.hasMore);
        setTotalOrders(res.data.totalOrders);
      } catch (error) {
        console.log(error);
        toast.error(t("admin.order.error"));
      }
      setLoading(false);
    };
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedStatus, language]);

  const handleNextPage = () => {
    if (hasMore) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleMarkAsDelivered = async (orderId: string) => {
    try {
      const res = await axios.put("/api/orderAdmin", { orderId });
      if (res.data.order) {
        setOrders(
          orders.map((order) =>
            order._id === orderId ? { ...order, status: "delivered" } : order
          )
        );
        toast.success(t("admin.order.actions.markAsDeliveredSuccess"));
      }
    } catch (error) {
      console.error("Error marking order as delivered:", error);
      toast.error(t("admin.order.actions.markAsDeliveredError"));
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm(t("admin.order.delete.confirm"))) {
      try {
        await axios.delete(`/api/orderAdmin?orderId=${orderId}`);
        setOrders(orders.filter((order) => order._id !== orderId));
        toast.success(t("admin.order.delete.success"));
      } catch (error) {
        console.error("Error deleting order:", error);
        toast.error(t("admin.order.delete.error"));
      }
    }
  };

  const totalPages = Math.ceil(totalOrders / limit);

  useEffect(() => {
    if (status !== "authenticated" && !session?.user) {
      router.push("/");
    }
  }, [status, session, router]);

  const handleRejectPayment = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      await axios.put("/api/orderAdmin", {
        orderId: selectedOrderId,
        rejectPayment: true,
        rejectionReason: rejectionReason,
      });

      toast.success(t("admin.order.payment.rejectSuccess"));
      setOrders(
        orders.map((o) =>
          o._id === selectedOrderId ? { ...o, status: "cancelled" } : o
        )
      );
      setIsRejectModalOpen(false);
      setRejectionReason("");
      setSelectedOrderId("");
    } catch (err) {
      toast.error(t("admin.order.payment.rejectError"));
    }
  };

  const handleConfirmPayment = async (orderId: string) => {
    try {
      await axios.put("/api/orderAdmin", {
        orderId: orderId,
        confirmPayment: true,
      });
      toast.success(t("admin.order.payment.confirmSuccess"));
      setOrders(
        orders.map((o) =>
          o._id === orderId ? { ...o, paid: true, status: "processing" } : o
        )
      );
      // Clear cart after confirming payment
      clearCart();
    } catch (err) {
      toast.error(t("admin.order.payment.confirmError"));
    }
  };

  return (
    <div className="bg-background dark:bg-gray-900">
      <div className="flex flex-col gap-4 md:gap-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-semibold text-[#535C91] dark:text-[#6B74A9]">
            {t("admin.order.title")}
          </h2>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label
              htmlFor="status-select"
              className="text-gray-600 dark:text-gray-300 text-sm font-medium whitespace-nowrap"
            >
              {t("admin.order.filter.status")}:
            </label>
            <select
              id="status-select"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#535C91] dark:focus:ring-[#6B74A9] min-w-[140px] w-full sm:w-auto"
            >
              <option value="all">{t("common.all")}</option>
              <option value="pending">{t("admin.order.status.pending")}</option>
              <option value="processing">
                {t("admin.order.status.processing")}
              </option>
              <option value="delivered">
                {t("admin.order.status.delivered")}
              </option>
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md w-full">
          {loading ? (
            <OrdersSkeleton />
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                {t("admin.order.table.noOrders")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <div className="space-y-4 w-full">
                <AnimatePresence>
                  {orders.map((order) => (
                    <motion.div
                      key={order._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 sm:p-6 w-full"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="text-xl font-semibold text-[#535C91] dark:text-[#6B74A9]">
                            {order.name}
                          </h2>
                          <p className="text-xl text-yellow-500 font-mono">
                            Order #{order._id.slice(-12).toUpperCase()}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <span
                            className={`px-5 py-2 rounded-full text-base font-semibold shadow-sm transition-all duration-200 ${
                              order.status === "delivered"
                                ? "bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-200"
                                : order.status === "pending"
                                ? "bg-yellow-200 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200"
                                : "bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200"
                            }`}
                          >
                            {order.status === "delivered" && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                <span>{t("admin.order.status.delivered")}</span>
                              </div>
                            )}
                            {order.status === "processing" && (
                              <span>{t("admin.order.status.processing")}</span>
                            )}
                            {order.status === "pending" && (
                              <span>{t("admin.order.status.pending")}</span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-600 dark:text-gray-300">
                            <strong className="text-gray-700 dark:text-gray-200">
                              {t("common.email")}:
                            </strong>{" "}
                            {order.email}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300">
                            <strong className="text-gray-700 dark:text-gray-200">
                              {t("common.city")}:
                            </strong>{" "}
                            {order.city}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300">
                            <strong className="text-gray-700 dark:text-gray-200">
                              {t("common.postalCode")}:
                            </strong>{" "}
                            {order.postalCode}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-300">
                            <strong className="text-gray-700 dark:text-gray-200">
                              {t("common.streetAddress")}:
                            </strong>{" "}
                            {order.streetAddress}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300">
                            <strong className="text-gray-700 dark:text-gray-200">
                              {t("common.country")}:
                            </strong>{" "}
                            {order.country}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300">
                            <strong className="text-gray-700 dark:text-gray-200">
                              {t("common.total")}:
                            </strong>{" "}
                            ${order.total}
                          </p>
                        </div>
                      </div>

                      <p className="text-gray-600 dark:text-gray-300 mt-2">
                        <strong className="text-gray-700 dark:text-gray-200">
                          {t("common.createdAt")}:
                        </strong>{" "}
                        {new Date(order.createdAt).toLocaleString()}
                      </p>

                      <div className="mt-4">
                        <div className="flex flex-col sm:flex-row w-full gap-4">
                          <div className="flex-1">
                            <strong className="text-gray-700 dark:text-gray-200 block mb-2">
                              Products
                            </strong>
                            <div className="space-y-2">
                              {order.cartProducts.map((productItem, index) => (
                                <div
                                  key={index}
                                  className="flex items-center space-x-3 bg-white dark:bg-gray-800 p-3 rounded-md"
                                >
                                  <Package className="w-6 h-6 text-[#535C91] dark:text-[#6B74A9] flex-shrink-0" />
                                  <div className="flex-grow">
                                    {productItem.product ? (
                                      <Link
                                        href={`/product/${productItem.product._id}`}
                                        passHref
                                      >
                                        <div className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-md transition-colors duration-200">
                                          <p className="font-medium text-[#535C91] dark:text-[#6B74A9] hover:underline">
                                            {productItem.product.name}
                                          </p>
                                          <p className="text-sm text-gray-600 dark:text-gray-300">
                                            {t("common.quantity")}:{" "}
                                            {productItem.quantity} |
                                            {t("common.price")}: $
                                            {productItem.product.price}
                                          </p>
                                        </div>
                                      </Link>
                                    ) : (
                                      <p className="text-red-500 dark:text-red-400">
                                        {t("common.productNotAvailable")}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {order.paymentProofUrl && (
                            <div className="w-full sm:w-80">
                              <strong className="text-gray-700 dark:text-gray-200 block mb-2">
                                Payment Proof
                              </strong>
                              <button
                                className="block focus:outline-none w-full"
                                onClick={() =>
                                  setLightboxUrl(order.paymentProofUrl!)
                                }
                                aria-label="Open payment proof image"
                              >
                                <Image
                                  src={order.paymentProofUrl}
                                  alt="Payment Proof"
                                  width={320}
                                  height={160}
                                  className="w-full max-h-32 object-cover rounded shadow border cursor-pointer"
                                  unoptimized
                                />
                              </button>
                              {order.paymentReference && (
                                <div className="mt-2">
                                  <strong>Payment Reference:</strong>{" "}
                                  {order.paymentReference}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-4">
                        <Link
                          href={`/orders/${order._id}`}
                          className="flex items-center space-x-1 bg-[#535C91] dark:bg-[#6B74A9] text-white px-3 py-1 rounded hover:bg-[#424874] dark:hover:bg-[#535C91] transition-colors duration-200"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">
                            {t("admin.order.actions.view")}
                          </span>
                        </Link>
                        {order.status === "processing" && (
                          <button
                            onClick={() => handleMarkAsDelivered(order._id)}
                            className="flex items-center space-x-1 bg-[#535C91] dark:bg-[#6B74A9] text-white px-3 py-1 rounded hover:bg-[#424874] dark:hover:bg-[#535C91] transition-colors duration-200"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>
                              {t("admin.order.actions.markAsDelivered")}
                            </span>
                          </button>
                        )}
                        {order.paid === false && order.paymentProofUrl && (
                          <>
                            <button
                              onClick={() => handleConfirmPayment(order._id)}
                              className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Confirm Payment</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedOrderId(order._id);
                                setIsRejectModalOpen(true);
                              }}
                              className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Reject Payment</span>
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteOrder(order._id)}
                          className="flex items-center space-x-1 bg-red-500 dark:bg-red-600 text-white px-3 py-1 rounded hover:bg-red-600 dark:hover:bg-red-700 transition-colors duration-200"
                          title={t("admin.order.actions.delete")}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">
                            {t("admin.order.actions.delete")}
                          </span>
                        </button>
                      </div>
                      {/* Vehicle Assignment for processing orders */}
                      {order.status === "processing" && (
                        <div className="mt-4">
                          <VehicleAssignment
                            orderId={order._id}
                            currentStatus={order.status}
                            onAssignmentComplete={() => {
                              // Optionally refresh orders after assignment
                              setPage(1); // or call fetchOrders if you want to refresh
                            }}
                          />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center p-4 border-t dark:border-gray-700">
            <button
              onClick={handlePrevPage}
              disabled={page === 1}
              className="flex items-center space-x-2 bg-[#535C91] dark:bg-[#6B74A9] text-black dark:text-gray-200 px-4 py-2 rounded disabled:bg-gray-300 dark:disabled:bg-gray-700 transition-colors duration-200"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">{t("common.previous")}</span>
            </button>
            <span className="text-lg text-gray-700 dark:text-gray-300">
              {t("common.pagination", { current: page, total: totalPages })}
            </span>
            <button
              onClick={handleNextPage}
              disabled={!hasMore}
              className="flex items-center space-x-2 bg-[#c4c6da] dark:bg-[#6B74A9] text-black dark:text-gray-200 px-4 py-2 rounded disabled:bg-gray-300 dark:disabled:bg-gray-700 transition-colors duration-200"
            >
              <span className="hidden sm:inline">{t("common.next")}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-2 right-2 bg-white rounded-full p-2 shadow hover:bg-gray-200"
              onClick={() => setLightboxUrl(null)}
              aria-label="Close payment proof lightbox"
            >
              <span className="text-3xl font-extrabold text-black">
                &times;
              </span>
            </button>
            <Image
              src={lightboxUrl}
              alt="Payment Proof Large"
              width={800}
              height={600}
              className="rounded shadow-lg max-w-[90vw] max-h-[80vh]"
              unoptimized
            />
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.order.payment.rejectPrompt")}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection"
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectModalOpen(false);
                setRejectionReason("");
                setSelectedOrderId("");
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectPayment}>
              Reject Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;

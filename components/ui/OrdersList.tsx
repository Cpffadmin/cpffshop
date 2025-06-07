import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import OrderItem from "./OrderItem";
import toast from "react-hot-toast";
import type { Order, OrdersResponse } from "@/types";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { useTranslation } from "@/providers/language/LanguageContext";

// Add this component before the OrdersList component
const OrdersSkeleton = () => {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <Card
          key={i}
          className="w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700"
        >
          <CardHeader className="bg-[#535C91] dark:bg-[#6B74A9] p-6">
            <div className="flex justify-between items-center">
              <LoadingSkeleton
                height="h-6"
                width="w-48"
                className="bg-white/20"
              />
              <LoadingSkeleton
                height="h-6"
                width="w-24"
                className="bg-white/20"
              />
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-4">
              {[...Array(2)].map((_, j) => (
                <div
                  key={j}
                  className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <LoadingSkeleton
                    height="h-20"
                    width="w-20"
                    className="rounded-lg"
                  />
                  <div className="flex-1 space-y-2">
                    <LoadingSkeleton height="h-5" width="w-48" />
                    <LoadingSkeleton height="h-4" width="w-32" />
                    <LoadingSkeleton height="h-4" width="w-24" />
                  </div>
                  <LoadingSkeleton height="h-6" width="w-16" />
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <LoadingSkeleton height="h-6" width="w-32" />
              <LoadingSkeleton height="h-6" width="w-24" />
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 dark:bg-gray-700/50 p-6 flex justify-end">
            <LoadingSkeleton height="h-10" width="w-32" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

const OrdersList = () => {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Reset orders when session changes
  useEffect(() => {
    setOrders([]);
    setPage(1);
    setHasMore(false);
    setError(null);
  }, [session?.user?.email]);

  const observer = useRef<IntersectionObserver>();

  const lastOrderElementRef = useCallback(
    (node: Element | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  const fetchOrders = useCallback(async () => {
    if (!session?.user?.email) {
      console.log("No user email found");
      setLoading(false);
      return;
    }

    try {
      const isFirstPage = page === 1;
      if (isFirstPage) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      console.log("Fetching orders for email:", session.user.email);
      const res = await axios.get<OrdersResponse>(
        `/api/orders?page=${page}&limit=10&email=${encodeURIComponent(
          session.user.email
        )}`
      );
      console.log("Orders response:", res.data);

      if (isFirstPage) {
        setOrders(res.data.orders);
      } else {
        setOrders((prevOrders) => [...prevOrders, ...res.data.orders]);
      }
      setHasMore(res.data.hasMore);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to fetch orders");
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, session?.user?.email]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [page, session?.user?.email, fetchOrders]);

  if (!session) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400">
        {t("orders.failedToFetch")}
      </p>
    );
  }

  if (loading) {
    return <OrdersSkeleton />;
  }

  return (
    <Card className="w-full bg-white dark:bg-gray-900 shadow-lg rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl">
      <CardHeader className="bg-[#535C91] dark:bg-[#6B74A9] p-6">
        <h2 className="text-3xl font-bold text-white">
          {t("orders.yourOrders")}
        </h2>
      </CardHeader>
      <CardContent className="p-6 space-y-4 bg-gray-50 dark:bg-gray-900/50">
        {error ? (
          <div className="text-center text-red-500 dark:text-red-400 bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg shadow-sm">
            <p>{t("orders.failedToFetch")}</p>
            <button
              onClick={() => {
                setError(null);
                setPage(1);
                fetchOrders();
              }}
              className="mt-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              {t("orders.tryAgain")}
            </button>
          </div>
        ) : orders.length === 0 && !loading ? (
          <div className="bg-white/50 dark:bg-gray-800/50 p-8 rounded-lg shadow-sm text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {t("orders.noOrders")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <div
                key={order._id}
                ref={index === orders.length - 1 ? lastOrderElementRef : null}
                className="bg-white/50 dark:bg-gray-800/50 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <OrderItem order={order} />
              </div>
            ))}
            {(loading || loadingMore) && (
              <div className="flex flex-col justify-center items-center h-32 bg-white/50 dark:bg-gray-800/50 rounded-lg shadow-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#535C91] dark:border-[#6B74A9] mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300 font-medium">
                  {t("orders.loading")}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrdersList;

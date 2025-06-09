"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle } from "lucide-react";
import axios from "axios";
import useCartStore from "@/store/cartStore";
import { useTranslation } from "@/providers/language/LanguageContext";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);
  const clearCart = useCartStore((state) => state.clearCart);
  const items = useCartStore((state) => state.items);

  // Effect to handle initial cart clearing
  useEffect(() => {
    console.log("Initial cart state:", items);
    const shouldClearCart = localStorage.getItem("should-clear-cart");
    if (shouldClearCart === "true") {
      console.log("Clearing cart from initial effect");
      clearCart();
      localStorage.removeItem("should-clear-cart");
    }
  }, [clearCart, items]);

  useEffect(() => {
    const orderId = searchParams?.get ? searchParams.get("orderId") : null;
    if (!orderId) {
      setError(t("checkout.success.error.noOrderId"));
      setIsLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await axios.get(`/api/orders/${orderId}`);
        setOrder(response.data);
        console.log("Order data received:", response.data);

        if (response.data.paid || response.data.status === "processing") {
          console.log("Order is paid or processing, clearing cart");
          localStorage.setItem("should-clear-cart", "true");
          await clearCart();

          // Double check if cart is cleared
          if (items.length > 0) {
            console.log("Cart still has items, forcing clear");
            await clearCart();
          }

          setTimeout(() => {
            router.push("/profile");
          }, 5000);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        setError(t("checkout.success.error.verificationFailed"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [router, searchParams, clearCart, t, items]);

  // Effect to monitor cart state
  useEffect(() => {
    console.log("Current cart items:", items);
  }, [items]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-gray-600">
            {t("checkout.success.verifyingOrder")}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ {error}</div>
          <button
            onClick={() => router.push("/profile")}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            {t("checkout.success.goToProfile")}
          </button>
        </div>
      </div>
    );
  }

  if (order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {t("checkout.success.orderConfirmed")}
          </h1>
          {order.paid ? (
            <p className="text-gray-600 mb-4">
              {t("checkout.success.paymentReceived")}
            </p>
          ) : (
            <p className="text-gray-600 mb-4">
              {t("checkout.success.paymentVerifying")}
            </p>
          )}
          <div className="bg-white rounded shadow p-4 mx-auto max-w-md mb-4">
            <div className="text-left text-gray-700">
              <div>
                <b>{t("checkout.success.orderDetails.orderId")}:</b> {order._id}
              </div>
              <div>
                <b>{t("checkout.success.orderDetails.name")}:</b> {order.name}
              </div>
              <div>
                <b>{t("checkout.success.orderDetails.email")}:</b> {order.email}
              </div>
              <div>
                <b>{t("checkout.success.orderDetails.status")}:</b>{" "}
                {order.status}
              </div>
              <div>
                <b>{t("checkout.success.orderDetails.total")}:</b> $
                {order.total?.toFixed(2)}
              </div>
              {order.paymentReference && (
                <div>
                  <b>{t("checkout.success.orderDetails.paymentReference")}:</b>{" "}
                  {order.paymentReference}
                </div>
              )}
            </div>
          </div>
          <p className="text-gray-500 mb-8">
            {t("checkout.success.redirectMessage")}{" "}
            {order.paid
              ? t("checkout.success.redirectInSeconds")
              : t("checkout.success.redirectAfterVerification")}
          </p>
          <button
            onClick={() => router.push("/profile?tab=orders")}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            {t("checkout.success.goToOrders")}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default function SuccessPage() {
  const { t } = useTranslation();
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

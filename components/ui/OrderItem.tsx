import React from "react";
import { Button } from "@/components/ui/button";
import type { Order } from "@/types";
import { useTranslation } from "@/providers/language/LanguageContext";

const OrderItem = ({ order }: { order: Order }) => {
  const { t } = useTranslation();

  // Function to safely format the total
  const formatTotal = (total: number | string) => {
    if (typeof total === "number") {
      return total.toFixed(2);
    } else if (typeof total === "string" && !isNaN(parseFloat(total))) {
      return parseFloat(total).toFixed(2);
    }
    return "N/A"; // or any default value you prefer
  };

  // Function to format order ID to 12-digit format
  const formatOrderId = (id: string) => {
    if (!id) return "N/A";
    return id.slice(-12).toUpperCase();
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl transition-all duration-300 hover:bg-gray-100/70 dark:hover:bg-gray-700/50 animate-fadeIn">
      <div>
        <p className="font-semibold text-lg text-gray-800 dark:text-gray-100">
          {t("orders.orderNumber", {
            id: formatOrderId(order._id),
          })}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("orders.placedOn")}{" "}
          {order.createdAt
            ? new Date(order.createdAt).toLocaleDateString()
            : "N/A"}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("orders.status")}{" "}
          {t(`orders.statusTypes.${order.status}`) || order.status || "N/A"}
        </p>
        <p className="text-sm font-medium text-[#535C91] dark:text-[#6B74A9]">
          {t("orders.total")} ${formatTotal(order.total)}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="bg-white/50 dark:bg-gray-800/50 text-[#535C91] dark:text-[#6B74A9] border-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:bg-gray-100/70 dark:hover:bg-gray-700/50 hover:border-[#1B1A55] dark:hover:border-[#6B74A9] focus:outline-none"
        onClick={() => (window.location.href = `/orders/${order._id}`)}
      >
        {t("orders.viewDetails")}
      </Button>
    </div>
  );
};

export default OrderItem;

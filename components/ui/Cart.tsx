import React, { useEffect, useState } from "react";
import useCartStore from "@/store/cartStore";
import Image from "next/image";
import { Trash2, ShoppingCart, Minus, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/providers/language/LanguageContext";

interface DeliverySettings {
  deliveryTypes: {
    local: { cost: number; name: string };
    express: { cost: number; name: string };
    overseas: { cost: number; name: string };
  };
  freeDeliveryThreshold: number;
}

interface CartProps {
  onClose: () => void;
  isMobile?: boolean;
}

const Cart = ({ onClose, isMobile = false }: CartProps) => {
  const { t, language } = useTranslation();
  const [deliverySettings, setDeliverySettings] =
    useState<DeliverySettings | null>(null);
  const [selectedDeliveryType, setSelectedDeliveryType] = useState("local");

  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity);

  // Debug: Log cart items and current language
  console.log("Cart items:", items);
  console.log("Current language:", language);

  useEffect(() => {
    const fetchDeliverySettings = async () => {
      try {
        const response = await fetch("/api/delivery");
        const data = await response.json();
        setDeliverySettings(data);
      } catch (error) {
        console.error("Failed to fetch delivery settings:", error);
      }
    };

    fetchDeliverySettings();
  }, []);

  useEffect(() => {
    if (isMobile) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isMobile]);

  const handleRemove = (
    event: React.MouseEvent<HTMLButtonElement>,
    id: string
  ) => {
    event.preventDefault();
    event.stopPropagation();
    removeItem(id);
  };

  const handleQuantityChange = (
    event: React.MouseEvent<HTMLButtonElement>,
    id: string,
    newQuantity: number
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (newQuantity < 1) {
      removeItem(id);
    } else {
      updateItemQuantity(id, newQuantity);
    }
  };

  const handleCheckout = () => {
    window.location.href = "/checkout";
  };

  const subtotal = getTotalPrice();
  const deliveryCost = deliverySettings
    ? subtotal >= deliverySettings.freeDeliveryThreshold
      ? 0
      : deliverySettings.deliveryTypes[
          selectedDeliveryType as keyof typeof deliverySettings.deliveryTypes
        ].cost
    : 0;
  const total = subtotal + deliveryCost;

  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        key="cart-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
      />

      {/* Cart Panel */}
      <motion.div
        key="cart-panel"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 20 }}
        className={`fixed top-0 right-0 h-full bg-white/15 dark:bg-gray-800/15 backdrop-blur-lg shadow-lg z-50 w-[85%] max-w-[400px]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {t("navigation.cart")}
            </h2>
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    clearCart();
                  }}
                  className="text-red-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {!items.length ? (
            <motion.div
              key="empty-cart"
              className="flex-1 flex flex-col items-center justify-center"
            >
              <ShoppingCart className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-300">
                {t("wishlist.empty")}
              </p>
            </motion.div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-4 mb-6">
                <AnimatePresence mode="popLayout">
                  {items.map((item) => (
                    <motion.div
                      key={item._id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex items-center p-3 border border-gray-200/30 dark:border-gray-700/30 rounded-lg bg-gray-50/50 dark:bg-gray-700/30 backdrop-blur-sm"
                    >
                      <Image
                        src={item.images[0]}
                        width={60}
                        height={60}
                        className="rounded-md object-cover mr-3"
                        alt={item.name}
                        unoptimized
                      />
                      <div className="flex-grow">
                        <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100 pr-2">
                          {item.displayNames?.[language] || item.name}
                        </h3>
                        <div className="flex flex-col">
                          <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
                            <span className="font-normal">
                              {t("product.brand.label")}:{" "}
                            </span>
                            {typeof item.brand === "string"
                              ? item.brand
                              : item.brand?.displayNames?.[language] ||
                                item.brand?.name}
                            {item.material && ` - ${item.material}`}
                          </p>
                        </div>
                        <div className="flex items-center mt-1">
                          <button
                            onClick={(e) =>
                              handleQuantityChange(
                                e,
                                item._id,
                                (item.quantity || 1) - 1
                              )
                            }
                            className="p-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-full transition-colors"
                          >
                            <Minus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                          </button>
                          <span className="mx-2 text-sm text-gray-800 dark:text-gray-200">
                            {item.quantity || 1}
                          </span>
                          <button
                            onClick={(e) =>
                              handleQuantityChange(
                                e,
                                item._id,
                                (item.quantity || 1) + 1
                              )
                            }
                            className="p-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-full transition-colors"
                          >
                            <Plus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                          </button>
                        </div>
                      </div>
                      <div className="ml-auto pl-4">
                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                          ${(item.price * (item.quantity || 1)).toFixed(2)}
                        </p>
                        <button
                          onClick={(e) => handleRemove(e, item._id)}
                          className="text-red-500 hover:text-red-600 transition-colors mt-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Delivery Options */}
              {deliverySettings && (
                <div className="border-t border-gray-200/30 dark:border-gray-700/30 pt-4 mb-4">
                  <h3 className="text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">
                    {t("admin.deliverySettings")}
                  </h3>
                  <select
                    value={selectedDeliveryType}
                    onChange={(e) => setSelectedDeliveryType(e.target.value)}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  >
                    {Object.entries(deliverySettings.deliveryTypes).map(
                      ([key, value]) => (
                        <option key={key} value={key}>
                          {value.name} - ${value.cost.toFixed(2)}
                        </option>
                      )
                    )}
                  </select>
                  {subtotal < deliverySettings.freeDeliveryThreshold && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {t("common.addToCart")} $
                      {(
                        deliverySettings.freeDeliveryThreshold - subtotal
                      ).toFixed(2)}{" "}
                      {t("footer.shippingReturns")}
                    </p>
                  )}
                </div>
              )}

              <div className="border-t border-gray-200/30 dark:border-gray-700/30 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 dark:text-gray-300">
                    {t("common.total")}:
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                {deliverySettings && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 dark:text-gray-300">
                      {t("footer.shippingReturns")}:
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      {deliveryCost === 0
                        ? t("common.free")
                        : `$${deliveryCost.toFixed(2)}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600 dark:text-gray-300">
                    {t("common.total")}:
                  </span>
                  <span className="font-semibold text-lg text-gray-800 dark:text-gray-100">
                    ${total.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91] text-white py-3 rounded-lg transition-colors"
                >
                  {t("orders.viewDetails")}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Cart;

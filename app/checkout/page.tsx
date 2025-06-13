"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Trash2, ShoppingCart, Plus, Minus, Lock } from "lucide-react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import secureCheckout from "@/public/securecheckout.png";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import useCartStore from "../../store/cartStore";
import { CartItem } from "@/types";
import { useCloudinary } from "@/components/providers/CloudinaryProvider";
import { useTranslation } from "@/providers/language/LanguageContext";
import {
  CldUploadButton,
  CloudinaryUploadWidgetResults,
} from "next-cloudinary";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

// Add DeliverySettings interface at the top of the file
interface DeliverySettings {
  deliveryTypes: {
    local: { cost: number; name: string };
    express: { cost: number; name: string };
    overseas: { cost: number; name: string };
  };
  freeDeliveryThreshold: number;
  bankAccountDetails: string;
}

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

const Cart = () => {
  const { t, language } = useTranslation();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const {
    items,
    removeItem,
    clearCart,
    getTotalItems,
    getTotalPrice,
    updateItemQuantity,
  } = useCartStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [country, setCountry] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>({
    deliveryTypes: {
      local: { cost: 0, name: "Local Delivery" },
      express: { cost: 0, name: "Express Delivery" },
      overseas: { cost: 0, name: "Overseas Delivery" },
    },
    freeDeliveryThreshold: 0,
    bankAccountDetails: "",
  });
  const [selectedDeliveryType, setSelectedDeliveryType] = useState("local");
  const [paymentMethod, setPaymentMethod] = useState<"online" | "offline">(
    "online"
  );
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [isSubmittingOffline, setIsSubmittingOffline] = useState(false);
  const { cloudName, uploadPreset } = useCloudinary();
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>("");
  const [hasFormChanges, setHasFormChanges] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const userId = session?.user?._id;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/checkout");
    }
  }, [status, router]);

  useEffect(() => {
    setIsLoading(false);
    const query = new URLSearchParams(window.location.search);
    if (query.get("success")) {
      setIsSuccess(true);
      clearCart();
    }

    // Set email if user is logged in
    if (session?.user?.email) {
      setEmail(session.user.email);
    }

    const fetchDeliverySettings = async () => {
      try {
        const response = await fetch("/api/delivery");
        const data = await response.json();
        setDeliverySettings({
          ...data,
          bankAccountDetails:
            data.bankAccountDetails || t("checkout.bankDetailsNotAvailable"),
        });
      } catch (error) {
        console.error("Failed to fetch delivery settings:", error);
      }
    };
    fetchDeliverySettings();
  }, [session, clearCart, t]);

  useEffect(() => {
    if (paymentMethod === "offline") {
      // Generate a unique reference number (e.g., IOP-YYYYMMDD-XXXX)
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
      setPaymentReference(`IOP-${dateStr}-${random}`);
    }
  }, [paymentMethod]);

  useEffect(() => {
    // Track form changes
    const formHasChanges =
      name !== "" ||
      email !== (session?.user?.email || "") ||
      city !== "" ||
      postalCode !== "" ||
      streetAddress !== "" ||
      country !== "" ||
      paymentProofUrl !== "" ||
      paymentDate !== "";

    setHasFormChanges(formHasChanges);
  }, [
    name,
    email,
    city,
    postalCode,
    streetAddress,
    country,
    paymentProofUrl,
    paymentDate,
    session?.user?.email,
  ]);

  const handleCheckout = async () => {
    if (isCheckingOut) return;
    if (!session?.user?._id) {
      toast.error(t("checkout.loginRequired"));
      router.push("/login?callbackUrl=/checkout");
      return;
    }

    try {
      setIsCheckingOut(true);
      const stripe = await stripePromise;
      if (!stripe) throw new Error(t("checkout.stripeInitError"));

      // Validate required fields
      if (
        !name ||
        !email ||
        !city ||
        !postalCode ||
        !streetAddress ||
        !country
      ) {
        toast.error(t("checkout.fillRequiredFields"));
        return;
      }

      console.log("Starting checkout process...");
      const response = await axios.post("/api/checkout", {
        name,
        email,
        city,
        postalCode,
        streetAddress,
        country,
        cartItems: items.map((item: CartItem) => ({
          id: item._id,
          quantity: item.quantity,
          price: item.price,
        })),
        user: userId,
        deliveryType: selectedDeliveryType,
      });

      console.log("Checkout response:", response.data);

      if (response.data.url) {
        console.log("Redirecting to:", response.data.url);
        window.location.href = response.data.url;
      } else {
        throw new Error(t("checkout.noCheckoutUrl"));
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(
        error instanceof Error ? error.message : t("checkout.checkoutError")
      );
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId);
    } else {
      updateItemQuantity(itemId, newQuantity);
    }
  };

  const renderEmailField = () => {
    if (session?.user?.email) {
      return (
        <input
          type="email"
          value={email}
          readOnly
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
        />
      );
    } else {
      return (
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      );
    }
  };

  const handlePaymentProofUpload = (result: CloudinaryUploadWidgetResults) => {
    if (
      result.info &&
      typeof result.info === "object" &&
      "secure_url" in result.info
    ) {
      setPaymentProofUrl(result.info.secure_url as string);
      toast.success("Upload successful!");
    }
  };

  const handleOfflinePayment = async () => {
    if (isSubmittingOffline) return;
    if (!session?.user?._id) {
      toast.error(t("checkout.loginRequired"));
      router.push("/login?callbackUrl=/checkout");
      return;
    }

    try {
      setIsSubmittingOffline(true);

      // Validate required fields
      if (
        !name ||
        !email ||
        !city ||
        !postalCode ||
        !streetAddress ||
        !country ||
        !paymentProofUrl
      ) {
        toast.error(t("checkout.fillRequiredFields"));
        return;
      }

      const payload = {
        name,
        email,
        city,
        postalCode,
        streetAddress,
        country,
        paymentProofUrl,
        paymentReference,
        paymentDate: new Date().toISOString(),
        deliveryType: selectedDeliveryType,
        cartItems: items.map((item: CartItem) => ({
          id: item._id,
          quantity: item.quantity,
          price: item.price,
        })),
        user: userId || "",
      };

      const response = await axios.post(
        "/api/checkout/offline-payment",
        payload
      );

      if (response.data.success) {
        toast.success(t("checkout.success.paymentVerifying"));
        window.location.href = `/checkout/success?orderId=${response.data.orderId}`;
      } else {
        throw new Error(response.data.message || t("checkout.checkoutError"));
      }
    } catch (error) {
      console.error("Offline payment error:", error);
      toast.error(
        error instanceof Error ? error.message : t("checkout.checkoutError")
      );
    } finally {
      setIsSubmittingOffline(false);
    }
  };

  const handleCancelOfflinePayment = () => {
    if (hasFormChanges) {
      const confirmed = window.confirm(t("common.confirmCancel"));
      if (!confirmed) {
        return;
      }
    }

    // Reset form state
    setName("");
    setEmail(session?.user?.email || "");
    setCity("");
    setPostalCode("");
    setStreetAddress("");
    setCountry("");
    setPaymentProofUrl("");
    setPaymentDate("");
    setPaymentMethod("online");

    // Clear any error states
    setIsSubmittingOffline(false);

    // Go back to previous page (cart)
    router.back();
  };

  // Add beforeunload event handler
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasFormChanges) {
        e.preventDefault();
        e.returnValue = t("common.formNotSaved");
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasFormChanges, t]);

  const handleCancelClick = () => {
    if (hasFormChanges) {
      setShowCancelDialog(true);
    } else {
      handleCancelOfflinePayment();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-blue-500 dark:border-blue-400"></div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          {t("checkout.thankYou")}
        </h1>
        <p className="text-gray-700 dark:text-gray-300">
          {t("checkout.orderConfirmation")}
        </p>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const deliveryCost = deliverySettings
    ? subtotal >= deliverySettings.freeDeliveryThreshold
      ? 0
      : deliverySettings.deliveryTypes[
          selectedDeliveryType as keyof typeof deliverySettings.deliveryTypes
        ].cost
    : 0;
  const total = subtotal + deliveryCost;

  const cancelDialog = (
    <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("common.confirmCancelTitle")}</DialogTitle>
          <DialogDescription>{t("common.confirmCancel")}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-start">
          <div className="flex gap-3 w-full">
            <Button
              variant="destructive"
              onClick={() => {
                setShowCancelDialog(false);
                handleCancelOfflinePayment();
              }}
            >
              {t("common.confirmCancelButton")}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              {t("common.keepEditing")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-100">
          {t("checkout.title")}
        </h2>

        {items.length === 0 ? (
          <div className="text-center py-10">
            <ShoppingCart className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500" />
            <p className="mt-4 text-xl text-gray-500 dark:text-gray-400">
              {t("checkout.emptyCart")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Products */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
                {t("checkout.orderSummary")}
              </h3>
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                {items.map((item: CartItem) => (
                  <div
                    className="flex items-center space-x-4 p-4 border-b border-gray-200 dark:border-gray-700 last:border-0"
                    key={item._id}
                  >
                    <Image
                      src={item?.images[0]}
                      width={80}
                      height={80}
                      className="rounded-md object-cover shadow-lg"
                      alt={item.displayNames?.[language] || item.name}
                      unoptimized
                    />
                    <div className="flex-grow">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                        {item.displayNames?.[language] || item.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t("product.brand.label")}:{" "}
                        {typeof item.brand === "string"
                          ? item.brand
                          : item.brand?.displayNames?.[language] ||
                            item.brand?.name}
                      </p>
                      <div className="flex items-center mt-2 space-x-2">
                        <button
                          onClick={() =>
                            handleQuantityChange(
                              item._id,
                              (item.quantity || 1) - 1
                            )
                          }
                          className="p-1 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          <Minus className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                        </button>
                        <span className="mx-2 text-sm text-gray-700 dark:text-gray-300">
                          {item.quantity || 1}
                        </span>
                        <button
                          onClick={() =>
                            handleQuantityChange(
                              item._id,
                              (item.quantity || 1) + 1
                            )
                          }
                          className="p-1 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          <Plus className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-gray-800 dark:text-gray-100">
                        ${(item.price * (item.quantity || 1)).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeItem(item._id)}
                        className="p-2 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-2 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="flex justify-between text-lg text-gray-800 dark:text-gray-200">
                  <span>{t("checkout.subtotal")}:</span>
                  <span className="font-semibold">{getTotalItems()}</span>
                </div>
                <div className="flex justify-between text-xl text-gray-800 dark:text-gray-200">
                  <span>{t("checkout.total")}:</span>
                  <span className="font-bold">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Right Column - Checkout Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
                {t("checkout.shippingInformation")}
              </h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder={t("checkout.name")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                {renderEmailField()}
                <input
                  type="text"
                  placeholder={t("checkout.city")}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <input
                  type="text"
                  placeholder={t("checkout.postalCode")}
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <input
                  type="text"
                  placeholder={t("checkout.streetAddress")}
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <input
                  type="text"
                  placeholder={t("checkout.country")}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring focus:ring-blue-200 dark:focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium mb-1">
                  {t("checkout.deliveryType")}
                </label>
                <select
                  value={selectedDeliveryType}
                  onChange={(e) => setSelectedDeliveryType(e.target.value)}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  {Object.entries(deliverySettings?.deliveryTypes || {}).map(
                    ([key, value]) => (
                      <option key={key} value={key}>
                        {value.name} - ${value.cost.toFixed(2)}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="online"
                      checked={paymentMethod === "online"}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as "online" | "offline")
                      }
                      className="form-radio text-[#535C91]"
                    />
                    <span className="text-gray-800 dark:text-gray-200">
                      {t("checkout.onlinePayment")}
                    </span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="offline"
                      checked={paymentMethod === "offline"}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as "online" | "offline")
                      }
                      className="form-radio text-[#535C91]"
                    />
                    <span className="text-gray-800 dark:text-gray-200">
                      {t("checkout.offlinePayment")}
                    </span>
                  </label>
                </div>

                {paymentMethod === "offline" && (
                  <div className="space-y-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("checkout.paymentProof")}
                      </label>
                      <div className="flex justify-end">
                        <CldUploadButton
                          uploadPreset={uploadPreset}
                          onSuccess={handlePaymentProofUpload}
                          options={{
                            cloudName,
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
                          <div className="bg-[#535C91] hover:bg-[#424874] text-white py-2 px-6 rounded-lg mb-2 text-center cursor-pointer">
                            {paymentProofUrl
                              ? t("checkout.reuploadFile")
                              : t("checkout.uploadFile")}
                          </div>
                        </CldUploadButton>
                      </div>
                      {paymentProofUrl && (
                        <div className="mt-2">
                          <Image
                            src={paymentProofUrl}
                            alt={t("checkout.paymentProof")}
                            width={320}
                            height={160}
                            className="max-h-40 rounded shadow"
                            unoptimized
                          />
                          <div className="text-xs text-gray-500 mt-1 break-all">
                            {paymentProofUrl}
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("checkout.paymentReference")}
                      </label>
                      <input
                        type="text"
                        value={paymentReference}
                        readOnly
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("checkout.bankAccountDetails")}
                      </label>
                      <div className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                        {deliverySettings.bankAccountDetails}
                      </div>
                    </div>
                    <div className="flex justify-between gap-4">
                      <Button
                        onClick={handleOfflinePayment}
                        disabled={isSubmittingOffline || items.length === 0}
                        className="flex-1 bg-[#535C91] hover:bg-[#424874] text-white py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmittingOffline ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            {t("checkout.submitting")}
                          </>
                        ) : (
                          <>
                            <Lock className="w-5 h-5" />
                            {t("checkout.submitPaymentProof")}
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleCancelClick}
                        disabled={isSubmittingOffline}
                        variant="outline"
                        className="flex-1 py-3 rounded-lg"
                      >
                        {t("common.cancelPayment")}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex justify-center mt-6">
                  {paymentMethod === "online" && (
                    <Button
                      onClick={handleCheckout}
                      disabled={isCheckingOut || items.length === 0}
                      className="w-full bg-[#535C91] hover:bg-[#424874] text-white py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCheckingOut ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {t("checkout.processing")}
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5" />
                          {t("checkout.payOnline")}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-center items-center space-x-4">
                <Image
                  src={secureCheckout}
                  alt={t("checkout.securePayment")}
                  width={250}
                  height={250}
                  className="dark:opacity-90"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      {cancelDialog}
    </div>
  );
};

export default Cart;

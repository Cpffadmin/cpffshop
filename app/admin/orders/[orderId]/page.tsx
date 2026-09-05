"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/providers/language/LanguageContext";
import axios from "axios";
import { format } from "date-fns";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  ShoppingBag,
  ArrowLeft,
  Package,
  CheckCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-hot-toast";
import VehicleAssignment from "@/components/logistics/VehicleAssignment";
import { formatAddress } from "@/utils/formatAddress";
import { MultiLangDisplay } from "@/components/MultiLangInput/MultiLangInput";

interface OrderProduct {
  product: {
    _id: string;
    name: string;
    price: number;
    images?: string[];
    description?: string;
    displayNames?: { [key: string]: string };
  };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  name: string;
  email: string;
  shippingAddress?: {
    formattedAddress: {
      en: string;
      "zh-TW": string;
    };
  };
  billingAddress?: {
    formattedAddress: {
      en: string;
      "zh-TW": string;
    };
  };
  total: number;
  subtotal: number;
  deliveryCost: number;
  deliveryType?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  cartProducts: OrderProduct[];
  paymentProofUrl?: string;
  paymentReference?: string;
  paid?: boolean;
  invoiceId?: string;
  invoiceNumber?: string;
  periodInvoiceNumber?: string;
  deliveryNotes?: string;
}

export default function AdminOrderDetailsPage({
  params: paramsPromise,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const params = React.use(paramsPromise);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, language } = useTranslation(); // Add language to destructuring
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const breadcrumbItems = [
    {
      label: t("admin.dashboard.title"),
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: t("admin-orders.title"),
      href: "/admin/orders",
      icon: ShoppingBag,
    },
  ];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !session?.user?.admin) {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // First try to get from orderAdmin endpoint
        const response = await axios.get(`/api/orderAdmin/${params.orderId}`);
        if (response.data.order) {
          setOrder(response.data.order);
        } else {
          // If not found in orderAdmin, try the regular orders endpoint
          const regularResponse = await axios.get(
            `/api/orders/${params.orderId}`
          );
          setOrder(regularResponse.data.order);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        toast.error(t("admin-orders.errors.fetchFailed"));
        router.push("/admin/orders"); // Redirect back to orders list on error
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.admin) {
      fetchOrder();
    }
  }, [params.orderId, session?.user?.admin, t, router]);

  const handleMarkAsDelivered = async () => {
    if (!order) return;

    try {
      const res = await axios.put("/api/orderAdmin", { orderId: order._id });
      if (res.data.order) {
        setOrder({ ...order, status: "delivered" });
        toast.success(t("admin-orders.actions.markAsDeliveredSuccess"));
      }
    } catch (error) {
      console.error("Error marking order as delivered:", error);
      toast.error(t("admin-orders.actions.markAsDeliveredError"));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center app-background">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#535C91] dark:border-[#6B74A9]"></div>
          <span className="animate-pulse">{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center app-background">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {t("admin-orders.errors.notFound")}
          </p>
          <Button onClick={() => router.push("/admin/orders")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("common.back")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-background transition-colors duration-200">
      <div className="app-global-container py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <Breadcrumb
              items={[
                ...breadcrumbItems,
                {
                  label: `${t("admin.order.details")} #${order?._id
                    .slice(-12)
                    .toUpperCase()}`,
                  href: `/admin/orders/${order?._id}`,
                  icon: Package,
                  current: true,
                },
              ]}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/orders")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("common.back")}
          </Button>
        </div>

        {/* Order Header Card */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold">
              {t("admin-orders.details.orderNumber", {
                id: order?._id.slice(-12).toUpperCase(),
              })}
            </CardTitle>
            <Badge className={getStatusColor(order?.status || "")}>
              {t(`admin-orders.status.${order?.status}`)}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("admin-orders.details.createdAt")}
                </p>
                <p className="font-medium">
                  {format(new Date(order?.createdAt || ""), "PPP")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("admin-orders.details.lastUpdated")}
                </p>
                <p className="font-medium">
                  {format(
                    new Date(order?.updatedAt || order?.createdAt || ""),
                    "PPP"
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("admin-orders.details.customerInfo.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("admin-orders.details.customerInfo.name")}
                </p>
                <p className="font-medium">{order?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("admin-orders.details.customerInfo.email")}
                </p>
                <p className="font-medium">{order?.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t("admin-orders.details.address.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Shipping Address */}
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("admin-orders.details.address.shipping")}
                </p>
                <div className="bg-card/50 p-4 rounded-lg">
                  {order?.shippingAddress ? (
                    <MultiLangDisplay
                      value={order.shippingAddress.formattedAddress}
                      currentLang={language}
                    />
                  ) : (
                    // Legacy address format
                    <p className="font-medium">
                      {order?.streetAddress}
                      {order?.city && `, ${order.city}`}
                      {order?.postalCode && ` ${order.postalCode}`}
                      {order?.country && `, ${order.country}`}
                    </p>
                  )}
                </div>
              </div>

              {/* Billing Address */}
              {order?.billingAddress && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("admin-orders.details.address.billing")}
                  </p>
                  <div className="bg-card/50 p-4 rounded-lg">
                    <MultiLangDisplay
                      value={order.billingAddress.formattedAddress}
                      currentLang={language}
                    />
                  </div>
                </div>
              )}

              {/* Delivery Notes */}
              {order?.deliveryNotes && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("admin-orders.details.deliveryNotes")}
                  </p>
                  <p className="font-medium">{order.deliveryNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t("admin-orders.details.items.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order?.cartProducts.map((item) => (
                <div
                  key={item.product._id}
                  className="flex items-center justify-between py-4 border-b last:border-0"
                >
                  <div className="flex items-center gap-4">
                    {item.product.images?.[0] && (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">
                        <MultiLangDisplay
                          value={
                            item.product.displayNames || {
                              en: item.product.name,
                              "zh-TW": item.product.name,
                            }
                          }
                          currentLang={language}
                        />
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("admin-orders.details.items.quantity")}:{" "}
                        {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="font-medium">
                    ${(item.quantity * item.product.price).toFixed(2)}
                  </p>
                </div>
              ))}

              <div className="pt-4 space-y-2">
                <div className="flex justify-between">
                  <p className="text-muted-foreground">
                    {t("admin-orders.details.items.subtotal")}
                  </p>
                  <p className="font-medium">${order?.subtotal.toFixed(2)}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-muted-foreground">
                    {t("admin-orders.details.items.deliveryCost")}
                  </p>
                  <p className="font-medium">
                    ${order?.deliveryCost.toFixed(2)}
                  </p>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <p className="font-bold">
                    {t("admin-orders.details.items.total")}
                  </p>
                  <p className="font-bold">${order?.total.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t("admin-orders.details.payment.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order?.paymentProofUrl && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {t("admin-orders.details.payment.proof")}
                </p>
                <div className="relative w-full h-48 rounded-lg overflow-hidden">
                  <Image
                    src={order.paymentProofUrl}
                    alt="Payment Proof"
                    fill
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="object-contain"
                  />
                </div>
              </div>
            )}
            {order?.paymentReference && (
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("admin-orders.details.payment.reference")}
                </p>
                <p className="font-medium">{order.paymentReference}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-4">
          {order?.status !== "delivered" && (
            <Button
              onClick={handleMarkAsDelivered}
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {t("admin-orders.actions.markAsDelivered")}
            </Button>
          )}
          {order?.invoiceId && (
            <Button variant="outline" asChild>
              <Link href={`/admin/invoices/${order.invoiceId}`}>
                {t("admin-orders.details.linkedInvoice")}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

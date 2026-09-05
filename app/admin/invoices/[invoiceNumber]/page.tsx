"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ArrowLeft, Download, Printer, FileText } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import VehicleAssignment from "@/components/logistics/VehicleAssignment";
import { translationLoader } from "@/utils/translationLoader";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface InvoiceItem {
  product: {
    _id: string;
    name: string;
    images: string[];
    price: number;
    description?: string;
  };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  name: string;
  email: string;
  total: number;
  status: string;
  createdAt: string;
  cartProducts: any[];
  deliveryCost: number;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  invoiceType: "one-time" | "period";
  periodInvoiceNumber?: string;
  amount: number;
  status: "pending" | "paid" | "overdue";
  periodStart?: string;
  periodEnd?: string;
  createdAt: string;
  paymentMethod: string;
  notes?: string;
  orders: Order[];
  items: InvoiceItem[];
  billingAddress?: any;
  shippingAddress?: any;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    address?: {
      en: string;
      "zh-TW": string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
  };
  paymentProofUrl?: string;
  paymentReference?: string;
  paymentDate?: string;
}

export default function AdminInvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceNumber: string }>;
}) {
  const { t, language } = useTranslation();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [isImageOpen, setIsImageOpen] = useState(false);

  const resolvedParams = React.use(params);
  const invoiceNumber = resolvedParams.invoiceNumber;

  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/invoices/admin/${invoiceNumber}`);
      setInvoice(response.data.invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      router.replace("/admin/invoices");
    } finally {
      setLoading(false);
    }
  }, [invoiceNumber, router]);

  useEffect(() => {
    if (!invoiceNumber) {
      router.replace("/admin/invoices");
      return;
    }

    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/admin/invoices");
      return;
    }

    if (session?.user && !session.user.admin) {
      router.replace("/");
      return;
    }

    if (session?.user?.admin) {
      fetchInvoice();
    }
  }, [status, session, router, invoiceNumber, fetchInvoice]);

  // Force reload translations when component mounts
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        await Promise.all([
          translationLoader.loadTranslationModule(
            language,
            "admin-invoicedetails"
          ),
          translationLoader.loadTranslationModule(language, "common"),
        ]);
      } catch (error) {
        console.error("Failed to load translations:", error);
      }
    };
    loadTranslations();
  }, [language]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const handlePrint = () => {
    const url = new URL(
      `/api/invoices/${invoiceNumber}/print`,
      window.location.origin
    );
    window.open(url.toString(), "_blank");
  };

  const handleDownload = () => {
    const url = new URL(
      `/api/invoices/${invoiceNumber}/download`,
      window.location.origin
    );
    window.open(url.toString(), "_blank");
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await axios.patch(
        `/api/invoices/admin/${invoiceNumber}`,
        {
          status: newStatus,
        }
      );

      if (response.data.success) {
        setInvoice(response.data.invoice);
        toast.success(t("invoices.statusUpdateSuccess", {}));
      }
    } catch (error) {
      console.error("Error updating invoice status:", error);
      toast.error(t("invoices.statusUpdateError", {}));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          {t("admin-invoicedetails.page.loading")}
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          {t("admin-invoicedetails.page.notFound")}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/invoices")}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">
              {t("admin-invoicedetails.invoiceDetails")} {invoice.invoiceNumber}
            </h1>
            <p className="text-sm text-gray-600">
              {t("admin-invoicedetails.page.created")}{" "}
              {format(new Date(invoice.createdAt), "MMM dd, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            {t("admin-invoicedetails.actions.print")}
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            {t("admin-invoicedetails.actions.download")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-card p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">
            {t("admin-invoice.details.customerInfo")}
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="text-muted-foreground">
                {t("admin-invoice.details.customerName")}:
              </div>
              <div>{invoice.user?.name || "-"}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-muted-foreground">
                {t("admin-invoice.details.phone")}:
              </div>
              <div>{invoice.user?.phone || "-"}</div>
            </div>
            <div className="flex justify-between items-start">
              <div className="text-muted-foreground">
                {t("admin-invoice.details.address")}:
              </div>
              <div className="text-right" style={{ maxWidth: "60%" }}>
                {invoice.user?.address
                  ? invoice.user.address[language] ||
                    invoice.user.address.en ||
                    "-"
                  : "-"}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">
            {t("admin-invoice.details.invoiceInfo")}
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="text-muted-foreground">
                {t("admin-invoice.details.status")}:
              </div>
              <Badge className={getStatusColor(invoice.status)}>
                {t(`admin-invoicedetails.status.${invoice.status}`)}
              </Badge>
            </div>
            {invoice.orders?.length > 0 && (
              <div className="flex justify-between items-center">
                <div className="text-muted-foreground">
                  {t("admin-invoice.details.orderNumber")}:
                </div>
                <div>
                  #
                  {typeof invoice.orders[0]._id === "string"
                    ? invoice.orders[0]._id.slice(-12).toUpperCase()
                    : invoice.orders[0]._id.toString()}
                </div>
              </div>
            )}
            <div className="flex justify-between items-center">
              <div className="text-muted-foreground">
                {t("admin-invoice.details.type")}:
              </div>
              <div>
                {invoice.invoiceType === "period"
                  ? t("admin-invoicedetails.type.period")
                  : t("admin-invoicedetails.type.oneTime")}
              </div>
            </div>
            {invoice.periodInvoiceNumber && (
              <div className="flex justify-between items-center">
                <div className="text-muted-foreground">
                  {t("admin-invoice.details.periodInvoice")}:
                </div>
                <div>{invoice.periodInvoiceNumber}</div>
              </div>
            )}
            {invoice.invoiceType === "period" &&
              invoice.periodStart &&
              invoice.periodEnd && (
                <div className="flex justify-between items-center">
                  <div className="text-muted-foreground">
                    {t("admin-invoice.details.period")}:
                  </div>
                  <div>
                    {format(new Date(invoice.periodStart), "MMM dd")} -{" "}
                    {format(new Date(invoice.periodEnd), "MMM dd, yyyy")}
                  </div>
                </div>
              )}
            <div className="flex justify-between items-center">
              <div className="text-muted-foreground">
                {t("admin-invoice.details.paymentMethod")}:
              </div>
              <div>
                {invoice.paymentMethod
                  ? t(
                      `admin-invoicedetails.paymentMethods.${invoice.paymentMethod}`
                    )
                  : "-"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Information Card */}
      <div className="bg-card p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {t("admin-invoicedetails.paymentInfo")}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody>
              {invoice.paymentReference && (
                <tr className="border-b border-border">
                  <td className="py-3 text-muted-foreground w-1/3">
                    {t("admin-invoicedetails.paymentReference")}:
                  </td>
                  <td className="py-3">{invoice.paymentReference}</td>
                </tr>
              )}
              <tr>
                <td className="py-3 align-top w-1/3">
                  <div className="text-muted-foreground mb-2">
                    {t("admin-invoicedetails.paymentProof")}:
                  </div>
                  {invoice.paymentProofUrl ? (
                    <>
                      <div
                        className="relative w-24 h-24 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setIsImageOpen(true)}
                      >
                        <Image
                          src={invoice.paymentProofUrl}
                          alt="Payment Proof"
                          fill
                          sizes="96px"
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
                        <DialogContent className="max-w-3xl">
                          <DialogTitle className="sr-only">
                            {t("admin-invoicedetails.paymentProof")}
                          </DialogTitle>
                          <div className="relative w-full h-[80vh]">
                            <Image
                              src={invoice.paymentProofUrl}
                              alt="Payment Proof"
                              fill
                              sizes="100vw"
                              className="object-contain"
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  ) : (
                    <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                      <FileText className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </td>
                <td className="py-3">
                  <div className="text-muted-foreground mb-2">
                    {t("admin-invoicedetails.paymentDate")}:
                  </div>
                  <div>
                    {invoice.paymentDate
                      ? format(new Date(invoice.paymentDate), "PPP")
                      : "-"}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-card p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {t("admin-invoicedetails.summary")}
        </h2>
        <div className="space-y-6">
          {/* Order Items */}
          <div>
            <h3 className="font-medium mb-3">
              {t("admin-invoicedetails.orders.products")}
            </h3>
            <div className="space-y-4">
              {invoice.orders?.[0]?.cartProducts?.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-start py-2 border-b border-border"
                >
                  <div className="flex-grow">
                    <div className="font-medium">
                      {item.product?.displayNames?.[language] ||
                        item.product?.name ||
                        t("admin-invoicedetails.orders.productNotFound")}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {t("admin-invoicedetails.quantity")}: {item.quantity}
                    </div>
                  </div>
                  <div className="text-right">
                    <div>${(item.price || 0).toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      ${((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Method */}
          <div className="py-2 border-b border-border">
            <div className="flex justify-between items-center">
              <div className="font-medium">
                {t("admin-invoicedetails.orders.deliveryMethod")}
              </div>
              <div>{t("admin-invoicedetails.orders.localDelivery")}</div>
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="text-muted-foreground">
                {t("admin-invoicedetails.subtotal")}
              </div>
              <div>
                $
                {invoice.orders?.[0]?.total
                  ? (
                      invoice.orders[0].total -
                      (invoice.orders[0].deliveryCost || 0)
                    ).toFixed(2)
                  : "0.00"}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-muted-foreground">
                {t("admin-invoicedetails.orders.deliveryCost")}
              </div>
              <div>
                ${invoice.orders?.[0]?.deliveryCost?.toFixed(2) || "0.00"}
              </div>
            </div>
            <div className="flex justify-between items-center font-medium text-lg">
              <div>{t("admin-invoicedetails.total")}</div>
              <div>${invoice.amount.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* All Orders List */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>
            {t("admin-invoicedetails.orders.title")} ({invoice.orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...invoice.orders]
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .map((order) => (
                <div
                  key={order._id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <p className="font-medium">
                      {t("admin-invoicedetails.orderNumber")} #
                      {order._id.slice(-12).toUpperCase()}
                    </p>
                    <Badge className={getStatusColor(order.status)}>
                      {t(
                        `admin-invoicedetails.status.${order.status.toLowerCase()}`
                      )}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>
                      {t("admin-invoicedetails.orders.created")}:{" "}
                      {format(new Date(order.createdAt), "PPP")}
                    </p>
                  </div>
                  {order.cartProducts && (
                    <div className="mt-2">
                      <p className="font-medium mb-1">
                        {t("admin-invoicedetails.orders.products")}:
                      </p>
                      {order.cartProducts.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex justify-between text-sm py-1"
                        >
                          <span>
                            {item.product?.displayNames?.[language] ||
                              item.product?.name ||
                              t(
                                "admin-invoicedetails.orders.productNotFound"
                              )}{" "}
                            × {item.quantity}
                          </span>
                          <span>
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      {order.deliveryCost > 0 && (
                        <div className="flex justify-between text-sm py-1 mt-2 pt-2">
                          <span>
                            {t("admin-invoicedetails.orders.deliveryCost")}
                          </span>
                          <span>${order.deliveryCost.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-medium text-white mt-4 pt-4 border-t">
                        <span>{t("admin-invoicedetails.orders.total")}:</span>
                        <span>${order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                  {/* Add Vehicle Assignment for processing orders */}
                  {order.status === "processing" && (
                    <div className="mt-4">
                      <VehicleAssignment
                        orderId={order._id}
                        currentStatus={order.status}
                        onAssignmentComplete={fetchInvoice}
                      />
                    </div>
                  )}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>{t("invoices.notes")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

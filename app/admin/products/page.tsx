"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios, { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Edit, Trash, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/providers/language/LanguageContext";
import { LayoutDashboard, Package } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";

interface Product {
  _id: string;
  name: string;
  brand: {
    _id: string;
    name: string;
    displayNames?: {
      en: string;
      "zh-TW": string;
    };
  };
  price: number;
  originalPrice: number;
  images: string[];
  createdAt: string;
  draft?: boolean;
  lastSaved?: Date;
  specifications?: Record<string, string>;
}

export default function AdminProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, language } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [drafts, setDrafts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const breadcrumbItems = [
    {
      label: t("navigation.adminPanel"),
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      label: t("product.admin.title"),
      href: "/admin/products",
      icon: Package,
    },
  ];

  useEffect(() => {
    // Redirect if not admin
    if (status === "authenticated" && !session?.user?.admin) {
      toast.error(t("common.error"));
      router.push("/");
      return;
    }

    // Only fetch products if user is authenticated and admin
    if (status === "authenticated" && session?.user?.admin) {
      const fetchProducts = async () => {
        try {
          console.log("Fetching products for admin...");
          const response = await axios.get("/api/products", {
            params: {
              includeDrafts: true,
              limit: 100,
            },
          });
          console.log("Admin products response:", response.data);

          if (!response.data.products) {
            throw new Error("No products data received");
          }

          const allProducts = response.data.products;
          const nonDrafts = allProducts.filter((p: Product) => !p.draft);
          const draftProducts = allProducts.filter((p: Product) => p.draft);

          console.log("Non-draft products:", nonDrafts.length);
          console.log("Draft products:", draftProducts.length);

          setProducts(nonDrafts);
          setDrafts(draftProducts);
        } catch (error) {
          console.error("Error fetching products:", error);
          if (error instanceof AxiosError) {
            console.error("Server error details:", error.response?.data);
          }
          toast.error(t("product.admin.error"));
        } finally {
          setLoading(false);
        }
      };

      fetchProducts();
    }
  }, [status, session, router, t]);

  // Auto-switch to grid view on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setViewMode("grid");
      } else {
        setViewMode("table"); // Reset to table view on desktop
      }
    };
    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Show loading for initial load or when checking auth
  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#535C91] dark:border-[#6B74A9]"></div>
      </div>
    );
  }

  // Return null if not authenticated or not admin (will redirect in useEffect)
  if (status === "authenticated" && !session?.user?.admin) {
    return null;
  }

  const handleDelete = async (productId: string) => {
    if (!confirm(t("product.admin.delete.confirm"))) return;

    try {
      await axios.delete(`/api/products/manage/${productId}`);
      setProducts(products.filter((product) => product._id !== productId));
      setDrafts(drafts.filter((product) => product._id !== productId));
      toast.success(t("product.admin.delete.success"));
    } catch (error) {
      console.error(error);
      toast.error(t("product.admin.delete.error"));
    }
  };

  const renderProductGrid = (items: Product[]) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((product) => (
          <Card key={product._id} className="overflow-hidden">
            <div className="relative aspect-square">
              <Image
                src={product.images[0] || "/placeholder-watch.jpg"}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
            <CardHeader>
              <h3 className="font-semibold">{product.name}</h3>
              <p className="text-sm text-muted-foreground">
                {product.brand.name}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold">${product.price.toLocaleString()}</p>
                  {product.originalPrice && (
                    <p className="text-sm text-muted-foreground line-through">
                      ${product.originalPrice.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/editProduct/${product._id}`}>
                    <Button
                      size="icon"
                      variant="outline"
                      title={t("product.admin.actions.edit")}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => handleDelete(product._id)}
                    title={t("product.admin.actions.delete")}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-8">
            {t("product.admin.table.noProducts")}
          </div>
        )}
      </div>
    );
  };

  const renderProductTable = (items: Product[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("product.admin.table.image")}</TableHead>
          <TableHead>{t("product.admin.table.name")}</TableHead>
          <TableHead>{t("product.admin.table.brand")}</TableHead>
          <TableHead>{t("product.admin.table.price")}</TableHead>
          <TableHead>{t("product.price")}</TableHead>
          <TableHead>{t("product.listedDate")}</TableHead>
          <TableHead className="text-right">
            {t("product.admin.table.actions")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((product) => (
          <TableRow key={product._id}>
            <TableCell>
              <div className="relative w-16 h-16">
                <Image
                  src={product.images[0] || "/placeholder-watch.jpg"}
                  alt={product.name}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
            </TableCell>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell>
              {product.brand?.displayNames?.[language] ||
                product.brand?.name ||
                "N/A"}
            </TableCell>
            <TableCell>${product.price.toLocaleString()}</TableCell>
            <TableCell>${product.originalPrice.toLocaleString()}</TableCell>
            <TableCell>
              {new Date(product.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Link href={`/admin/editProduct/${product._id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    title={t("product.admin.actions.edit")}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(product._id)}
                  title={t("product.admin.actions.delete")}
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {items.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8">
              {t("product.admin.table.noProducts")}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="app-global-container">
        <Breadcrumb items={breadcrumbItems} />
        <div className="bg-card rounded-lg p-6 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#535C91] to-[#424874] dark:from-[#6B74A9] dark:to-[#535C91] bg-clip-text text-transparent">
              {t("product.admin.title")}
            </h1>
            <div className="flex gap-4">
              {/* Hide toggle button on mobile, show on sm+ */}
              <div className="hidden sm:block">
                <Button
                  variant="outline"
                  onClick={() =>
                    setViewMode(viewMode === "table" ? "grid" : "table")
                  }
                >
                  {viewMode === "table"
                    ? t("product.admin.grid.title")
                    : t("product.admin.table.title")}
                </Button>
              </div>
              <Button
                className="bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91] text-white"
                onClick={() => router.push("/admin/products/create")}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("product.admin.create.title")}
              </Button>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            {t("product.admin.description")}
          </p>
        </div>

        <Tabs defaultValue="published" className="space-y-4">
          <TabsList className="w-full">
            <TabsTrigger value="published" className="flex-1">
              {t("product.admin.status.active")} ({products.length})
            </TabsTrigger>
            <TabsTrigger value="drafts" className="flex-1">
              {t("product.admin.status.draft")} ({drafts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="published">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">
                  {t("product.admin.status.active")}
                </h2>
              </CardHeader>
              <CardContent>
                {viewMode === "table"
                  ? renderProductTable(products)
                  : renderProductGrid(products)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drafts">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">
                  {t("product.admin.status.draft")}
                </h2>
              </CardHeader>
              <CardContent>
                {viewMode === "table"
                  ? renderProductTable(drafts)
                  : renderProductGrid(drafts)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

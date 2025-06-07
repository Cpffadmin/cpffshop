"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Orders from "@/components/AllOrders";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { LayoutDashboard, ShoppingBag } from "lucide-react";
import { useTranslation } from "@/providers/language/LanguageContext";

const breadcrumbItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: ShoppingBag,
  },
];

export default function AdminOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !session?.user?.admin) {
      router.push("/");
    }
  }, [status, session, router]);

  // Show loading for initial load or when checking auth
  if (
    status === "loading" ||
    (status === "authenticated" && !session?.user?.admin)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#535C91] dark:border-[#6B74A9]"></div>
          <span className="animate-pulse">Loading...</span>
        </div>
      </div>
    );
  }

  // Return null if not authenticated or not admin (will redirect in useEffect)
  if (status === "authenticated" && !session?.user?.admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="app-global-container">
        <div className="mb-8">
          <Breadcrumb items={breadcrumbItems} />
          <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-[#535C91] to-[#424874] dark:from-[#6B74A9] dark:to-[#535C91] bg-clip-text text-transparent">
              {t("admin.orderManagement")}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t("admin.orderManagementDescription")}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <Orders />
        </div>
      </div>
    </div>
  );
}

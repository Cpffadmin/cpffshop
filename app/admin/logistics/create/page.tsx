"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { LayoutDashboard, Truck } from "lucide-react";
import CreateLogisticsForm from "@/components/logistics/CreateLogisticsForm";
import { useTranslation } from "@/providers/language/LanguageContext";

export default function CreateLogisticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();

  const breadcrumbItems = [
    {
      label: t("navigation.adminPanel"),
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      label: t("navigation.logistics"),
      href: "/admin/logistics",
      icon: Truck,
    },
    {
      label: t("logistics.addVehicle"),
      href: "/admin/logistics/create",
      icon: Truck,
    },
  ];

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
          <span className="animate-pulse">{t("logistics.loading")}</span>
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
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Breadcrumb items={breadcrumbItems} />
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-[#535C91] to-[#424874] dark:from-[#6B74A9] dark:to-[#535C91] bg-clip-text text-transparent">
              {t("logistics.createPage.title")}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t("logistics.createPage.description")}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-gray-200 dark:ring-gray-700">
          <CreateLogisticsForm />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "@/providers/language/LanguageContext";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  LayoutGrid,
  Settings,
  Users,
  Package,
  ClipboardList,
  Tag,
  Mail,
  Truck,
  FileText,
  Grid,
  Sliders,
  Shield,
  Receipt,
  ImageIcon,
  Palette,
  Video,
} from "lucide-react";
import { shouldShowBrandAdmin } from "@/utils/config/featureFlags";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();

  const adminNavItems = [
    {
      href: "/admin/dashboard",
      label: t("admin.dashboard.title"),
      icon: LayoutGrid,
    },
    {
      href: "/admin/products",
      label: t("admin.products.title"),
      icon: Package,
    },
    {
      href: "/admin/categories",
      label: t("admin.categories.title"),
      icon: Grid,
    },
    {
      href: "/admin/specifications",
      label: t("admin.specifications.title"),
      icon: Sliders,
    },
    {
      href: "/admin/orders",
      label: t("admin-orders.title"),
      icon: ClipboardList,
    },
    {
      href: "/admin/invoices",
      label: t("invoice.title"),
      icon: Receipt,
    },
    {
      href: "/admin/roles",
      label: t("admin.users.title"),
      icon: Users,
    },
    {
      href: "/admin/brands",
      label: t("admin.brands.title"),
      icon: Tag,
    },
    {
      href: "/admin/newsletter",
      label: t("admin.newsletter.title"),
      icon: Mail,
    },
    {
      href: "/admin/logistics",
      label: t("admin.logistics.title"),
      icon: Truck,
    },
    {
      href: "/admin/blog/posts",
      label: t("admin.blog.title"),
      icon: FileText,
    },
    {
      href: "/admin/GuaranteeSection",
      label: t("admin.guarantee.title"),
      icon: Shield,
    },
    {
      href: "/admin/featuresSection",
      label: t("admin.features.title"),
      icon: Shield,
    },
    {
      href: "/admin/settings",
      label: t("admin.settings.title"),
      icon: Settings,
    },
    {
      href: "/admin/settings/theme",
      label: t("admin.settings.theme"),
      icon: Palette,
    },
    {
      href: "/admin/settings/hero",
      label: t("admin-hero.title"),
      icon: ImageIcon,
    },
    {
      href: "/admin/settings?tab=productIntro",
      label: t("admin.settings.productIntro"),
      icon: Video,
    },
    {
      href: "/admin/delivery",
      label: t("admin-deliverySettings.title"),
      icon: Truck,
    },
    {
      href: "/admin/privacy-policy",
      label: t("admin.privacy.title"),
      icon: FileText,
    },
    {
      href: "/admin/period-users",
      label: t("admin.periodUsers.title"),
      icon: Users,
    },
  ].filter((item) => item.show !== false);

  useEffect(() => {
    if (status === "authenticated" && !session?.user?.admin) {
      toast.error("Unauthorized: Admin access required");
      router.push("/");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!session?.user?.admin) {
    return null;
  }

  return (
    <div className="min-h-screen app-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-card min-h-screen shadow-md hidden md:block">
          <nav className="p-4">
            <ul className="space-y-2">
              {adminNavItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8 app-global-container">{children}</main>
      </div>
    </div>
  );
}

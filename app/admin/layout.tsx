"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
} from "lucide-react";
import { shouldShowBrandAdmin } from "@/utils/config/featureFlags";

const adminNavItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutGrid,
  },
  {
    href: "/admin/products",
    label: "Products",
    icon: Package,
  },
  {
    href: "/admin/categories",
    label: "Categories",
    icon: Grid,
  },
  {
    href: "/admin/specifications",
    label: "Specifications",
    icon: Sliders,
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: ClipboardList,
  },
  {
    href: "/admin/roles",
    label: "User Roles",
    icon: Users,
  },
  {
    href: "/admin/brands",
    label: "Brands",
    icon: Tag,
    show: shouldShowBrandAdmin(),
  },
  {
    href: "/admin/newsletter",
    label: "Newsletter",
    icon: Mail,
  },
  {
    href: "/admin/logistics",
    label: "Logistics",
    icon: Truck,
  },
  {
    href: "/admin/blog/posts",
    label: "Blog",
    icon: FileText,
  },
  {
    href: "/admin/GuaranteeSection",
    label: "Guarantee Section",
    icon: Shield,
  },
  {
    href: "/admin/featuresSection",
    label: "Features Section",
    icon: Shield,
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
  },
  {
    href: "/admin/privacy-policy",
    label: "Privacy Policy",
    icon: FileText,
  },
].filter((item) => item.show !== false);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 min-h-screen shadow-md hidden md:block">
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

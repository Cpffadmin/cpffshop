import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Settings,
  FileText,
  Tag,
  Grid,
  Sliders,
  ShoppingCart,
  Newspaper,
  Truck,
} from "lucide-react";

export const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: ShoppingBag },
  { href: "/admin/categories", label: "Categories", icon: Grid },
  { href: "/admin/specifications", label: "Specifications", icon: Sliders },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/roles", label: "User Roles", icon: Users },
  { href: "/admin/brands", label: "Brands", icon: Tag },
  { href: "/admin/newsletter", label: "Newsletter", icon: Newspaper },
  {
    href: "/admin/product-of-the-month",
    label: "Product of the Month",
    icon: Tag,
  },
  { href: "/admin/logistics", label: "Logistics", icon: Truck },
  { href: "/admin/blog/posts", label: "Blog", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

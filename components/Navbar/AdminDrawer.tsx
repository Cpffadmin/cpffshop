import React from "react";
import { Button } from "@/components/ui/button";
import { IoMdClose } from "react-icons/io";
import Link from "next/link";
import {
  Plus,
  ListOrdered,
  Mail,
  SettingsIcon,
  FileText,
  PenTool,
  Tag,
  Sliders,
  Grid,
  Shield,
  Star,
  Users,
  Truck,
  PackageCheck,
  Receipt,
  LayoutDashboard,
  ImageIcon,
  Palette,
  Video,
} from "lucide-react";
import { useTranslation } from "@/providers/language/LanguageContext";

interface AdminDrawerProps {
  admin: boolean;
  setAdmin: (value: boolean) => void;
  adminPanelMob?: boolean;
  setAdminPanelMob?: (value: boolean) => void;
}

const AdminDrawer = ({
  admin,
  setAdmin,
  adminPanelMob,
  setAdminPanelMob,
}: AdminDrawerProps) => {
  const { t, isLoading } = useTranslation();

  const handleClose = () => {
    if (adminPanelMob && setAdminPanelMob) {
      setAdminPanelMob(false);
      return;
    }
    setAdmin(false);
  };

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Don't render if translations aren't loaded yet
  if (isLoading) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 bg-black/50 transition-all duration-300 z-50 ${
        admin || adminPanelMob
          ? "opacity-100 visible"
          : "opacity-0 invisible pointer-events-none"
      }`}
      onClick={handleOutsideClick}
    >
      <div
        className={`absolute top-0 left-0 right-0 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/85 border-b border-border shadow-lg transition-all duration-300 transform overflow-y-auto max-h-[85vh] ${
          admin || adminPanelMob ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border p-4 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/85">
          <h2 className="text-2xl font-bold text-foreground">
            {t("navigation.adminPanel")}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground flex items-center gap-2"
          >
            <IoMdClose className="h-5 w-5" /> {t("navigation.close")}
          </Button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {t("admin.products.title")}
              </h3>
              <div className="space-y-2">
                <Link
                  href="/admin/products/create"
                  onClick={handleClose}
                  className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("admin.products.addNew")}
                </Link>
                <Link
                  href="/admin/products"
                  onClick={handleClose}
                  className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                >
                  <ListOrdered className="mr-2 h-4 w-4" />
                  {t("admin.products.viewAll")}
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {t("admin.categories.title")}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/admin/categories"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <Grid className="h-4 w-4 mr-2" />
                    {t("admin.categories.viewAll")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {t("admin.specifications.title")}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/admin/specifications"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <Sliders className="h-4 w-4 mr-2" />
                    {t("admin.specifications.viewAll")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {t("admin-orders.title")}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/admin/orders"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <ListOrdered className="mr-2 h-4 w-4" />
                    {t("admin-orders.table.title")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {t("invoice.title")}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/admin/invoices"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    {t("invoice.viewAll")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {t("admin.users.title")}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/admin/roles"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {t("admin.users.manageRoles")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {t("admin.brands.title")}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/admin/brands"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    {t("admin.brands.viewAll")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {t("admin.newsletter.title")}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/admin/newsletter"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {t("admin.newsletter.manage")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {t("admin.logistics.title")}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/admin/logistics"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    {t("admin.logistics.viewAll")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/logistics/create"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t("admin.logistics.addNew")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {t("admin.blog.title")}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/admin/blog/posts"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {t("admin.blog.manage")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {t("admin.guarantee.title")}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/admin/GuaranteeSection"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {t("admin.guarantee.manage")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {t("admin.features.title")}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/admin/featuresSection"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {t("admin.features.manage")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {t("admin.settings.title")}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/admin/dashboard"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    {t("admin.dashboard.title")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/settings"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    {t("admin.settings.manage")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/settings/theme"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <Palette className="h-4 w-4 mr-2" />
                    {t("admin-settings.sections.theme.title")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/settings/hero"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {t("admin-hero.title")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/settings?tab=productIntro"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    {t("admin.settings.productIntro")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/delivery"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <PackageCheck className="h-4 w-4 mr-2" />
                    {t("admin-deliverySettings.title")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {t("admin.privacy.title")}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/admin/privacy-policy"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {t("admin.privacy.manage")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {t("admin.periodUsers.title")}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/admin/period-users"
                    onClick={handleClose}
                    className="flex items-center rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {t("admin.periodUsers.manage")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDrawer;

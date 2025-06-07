"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import { IBrand } from "@/utils/models/Brand";
import { shouldShowBrandAdmin } from "@/utils/config/featureFlags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tag, Plus, LayoutDashboard } from "lucide-react";
import { useTranslation } from "@/providers/language/LanguageContext";
import {
  MultiLangInput,
  MultiLangDisplay,
} from "@/components/MultiLangInput/index";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface NewBrand {
  name: string;
  displayNames: {
    en: string;
    "zh-TW": string;
  };
  descriptions: {
    en: string;
    "zh-TW": string;
  };
  isActive: boolean;
}

interface EditableBrand {
  _id: string;
  name: string;
  displayNames: {
    en: string;
    "zh-TW": string;
  };
  descriptions: {
    en: string;
    "zh-TW": string;
  };
  isActive: boolean;
}

export default function BrandsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { language, t } = useTranslation();
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<EditableBrand | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<EditableBrand | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [newBrand, setNewBrand] = useState<NewBrand>({
    name: "",
    displayNames: { en: "", "zh-TW": "" },
    descriptions: { en: "", "zh-TW": "" },
    isActive: true,
  });

  const breadcrumbItems = [
    {
      label: t("navigation.adminPanel"),
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      label: t("navigation.brands"),
      href: "/admin/brands",
      icon: Tag,
    },
  ];

  useEffect(() => {
    if (!shouldShowBrandAdmin()) {
      router.push("/admin");
      return;
    }

    if (status === "authenticated" && !session?.user?.admin) {
      toast.error("Unauthorized: Admin access required");
      router.push("/");
      return;
    }

    if (status === "authenticated" && session?.user?.admin) {
      fetchBrands();
    }
  }, [status, session, router]);

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

  const fetchBrands = async () => {
    try {
      const response = await axios.get("/api/admin/brands");
      setBrands(response.data.brands || []);
    } catch (error) {
      console.error("Error fetching brands:", error);
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error || "Failed to fetch brands");
      } else {
        toast.error("Failed to fetch brands");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      await axios.post("/api/admin/brands", { action: "sync" });
      toast.success("Brands synced successfully");
      fetchBrands();
    } catch (error) {
      console.error("Error syncing brands:", error);
      toast.error("Failed to sync brands");
    }
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/admin/brands", {
        action: "create",
        ...newBrand,
      });
      setShowCreateModal(false);
      setNewBrand({
        name: "",
        displayNames: { en: "", "zh-TW": "" },
        descriptions: { en: "", "zh-TW": "" },
        isActive: true,
      });
      toast.success(t("brands.create.success"));
      await fetchBrands();
    } catch (error) {
      console.error("Error creating brand:", error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || t("brands.create.error"));
      } else {
        toast.error(t("brands.create.error"));
      }
    }
  };

  const handleEditBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand) return;

    try {
      await axios.patch(`/api/admin/brands`, {
        id: editingBrand._id,
        name: editingBrand.name,
        displayNames: {
          en: editingBrand.displayNames?.en || "",
          "zh-TW": editingBrand.displayNames?.["zh-TW"] || "",
        },
        descriptions: {
          en: editingBrand.descriptions?.en || "",
          "zh-TW": editingBrand.descriptions?.["zh-TW"] || "",
        },
        isActive: editingBrand.isActive,
      });
      setShowEditModal(false);
      setEditingBrand(null);
      toast.success(t("brands.update.success"));
      fetchBrands();
    } catch (error) {
      console.error(error);
      toast.error(t("brands.update.error"));
    }
  };

  const toggleBrandStatus = async (brand: IBrand) => {
    try {
      await axios.patch(`/api/admin/brands`, {
        id: brand._id,
        isActive: !brand.isActive,
      });
      toast.success("Brand status updated");
      fetchBrands();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update brand status");
    }
  };

  const handleDeleteBrand = async () => {
    if (!deletingBrand) return;

    try {
      await axios.delete(`/api/admin/brands`, {
        data: { id: deletingBrand._id },
      });
      setShowDeleteModal(false);
      setDeletingBrand(null);
      toast.success("Brand deleted successfully");
      fetchBrands();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete brand");
    }
  };

  const handleEditClick = (brand: IBrand) => {
    setEditingBrand({
      _id: brand._id.toString(),
      name: brand.name,
      displayNames: brand.displayNames || { en: "", "zh-TW": "" },
      descriptions: brand.descriptions || { en: "", "zh-TW": "" },
      isActive: brand.isActive,
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (brand: IBrand) => {
    setDeletingBrand({
      _id: brand._id.toString(),
      name: brand.name,
      displayNames: brand.displayNames || { en: "", "zh-TW": "" },
      descriptions: brand.descriptions || { en: "", "zh-TW": "" },
      isActive: brand.isActive,
    });
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="app-global-container">
        <Breadcrumb items={breadcrumbItems} />
        <div className="bg-card rounded-lg p-6 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#535C91] to-[#424874] dark:from-[#6B74A9] dark:to-[#535C91] bg-clip-text text-transparent">
                {language === "en" ? "Brand Management" : "品牌管理"}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {language === "en"
                  ? "Manage your product brands"
                  : "管理您的產品品牌"}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleSync}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Tag className="w-4 h-4" />
                {language === "en" ? "Sync Brands" : "同步品牌"}
              </Button>
              <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    {language === "en" ? "Add Brand" : "新增品牌"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {language === "en" ? "Add Brand" : "新增品牌"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateBrand}>
                    <div className="space-y-4">
                      <div>
                        <Label>
                          {language === "en"
                            ? "Internal Reference Name"
                            : "內部參考名稱"}
                        </Label>
                        <Input
                          value={newBrand.name}
                          onChange={(e) =>
                            setNewBrand({ ...newBrand, name: e.target.value })
                          }
                          required
                        />
                      </div>
                      <MultiLangInput
                        label={language === "en" ? "Display Name" : "顯示名稱"}
                        value={newBrand.displayNames}
                        onChange={(value) =>
                          setNewBrand({ ...newBrand, displayNames: value })
                        }
                        placeholder={{
                          en: "Brand name in English",
                          "zh-TW": "品牌名稱",
                        }}
                      />
                      <MultiLangInput
                        label={language === "en" ? "Description" : "描述"}
                        type="textarea"
                        value={newBrand.descriptions}
                        onChange={(value) =>
                          setNewBrand({ ...newBrand, descriptions: value })
                        }
                        placeholder={{
                          en: "Brand description in English",
                          "zh-TW": "品牌描述",
                        }}
                      />
                    </div>
                    <DialogFooter className="mt-4">
                      <Button type="submit">
                        {language === "en" ? "Create Brand" : "建立品牌"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {brands.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 mt-6">
            {t("brands.list.empty")}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 mt-6">
            {/* Mobile Grid View */}
            <div className="block md:hidden">
              <div className="grid grid-cols-1 gap-4 p-4">
                {brands.map((brand) => (
                  <div
                    key={brand._id.toString()}
                    className="bg-card border rounded-lg p-4 space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">
                        <MultiLangDisplay
                          value={brand.displayNames}
                          currentLang={language === "en" ? "en" : "zh-TW"}
                        />
                      </h3>
                      <Switch
                        checked={brand.isActive}
                        onCheckedChange={() => toggleBrandStatus(brand)}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(brand)}
                      >
                        {language === "en" ? "Edit" : "編輯"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(brand)}
                      >
                        {language === "en" ? "Delete" : "刪除"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {language === "en" ? "Brand Name" : "品牌名稱"}
                    </TableHead>
                    <TableHead>
                      {language === "en" ? "Internal Name" : "內部名稱"}
                    </TableHead>
                    <TableHead>
                      {language === "en" ? "Status" : "狀態"}
                    </TableHead>
                    <TableHead className="text-right">
                      {language === "en" ? "Actions" : "操作"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brands.map((brand) => (
                    <TableRow key={brand._id.toString()}>
                      <TableCell className="font-medium">
                        <MultiLangDisplay
                          value={brand.displayNames}
                          currentLang={language === "en" ? "en" : "zh-TW"}
                        />
                      </TableCell>
                      <TableCell>{brand.name}</TableCell>
                      <TableCell>
                        <Switch
                          checked={brand.isActive}
                          onCheckedChange={() => toggleBrandStatus(brand)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(brand)}
                          >
                            {language === "en" ? "Edit" : "編輯"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(brand)}
                          >
                            {language === "en" ? "Delete" : "刪除"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Edit Brand Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === "en" ? "Edit Brand" : "編輯品牌"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditBrand}>
              <div className="space-y-4">
                <div>
                  <Label>
                    {language === "en"
                      ? "Internal Reference Name"
                      : "內部參考名稱"}
                  </Label>
                  <Input
                    value={editingBrand?.name || ""}
                    onChange={(e) =>
                      setEditingBrand(
                        editingBrand
                          ? { ...editingBrand, name: e.target.value }
                          : null
                      )
                    }
                    required
                  />
                </div>
                <MultiLangInput
                  label={language === "en" ? "Display Name" : "顯示名稱"}
                  value={editingBrand?.displayNames || { en: "", "zh-TW": "" }}
                  onChange={(value) =>
                    setEditingBrand(
                      editingBrand
                        ? { ...editingBrand, displayNames: value }
                        : null
                    )
                  }
                  placeholder={{
                    en: "Brand name in English",
                    "zh-TW": "品牌名稱",
                  }}
                />
                <MultiLangInput
                  label={language === "en" ? "Description" : "描述"}
                  type="textarea"
                  value={editingBrand?.descriptions || { en: "", "zh-TW": "" }}
                  onChange={(value) =>
                    setEditingBrand(
                      editingBrand
                        ? { ...editingBrand, descriptions: value }
                        : null
                    )
                  }
                  placeholder={{
                    en: "Brand description in English",
                    "zh-TW": "品牌描述",
                  }}
                />
              </div>
              <DialogFooter className="mt-4">
                <Button type="submit">
                  {language === "en" ? "Save Changes" : "保存更改"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Brand Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === "en"
                  ? "Are you sure you want to delete this brand?"
                  : "確定要刪除這個品牌嗎？"}
              </DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                {language === "en" ? "Cancel" : "取消"}
              </Button>
              <Button variant="destructive" onClick={handleDeleteBrand}>
                {language === "en" ? "Delete" : "刪除"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

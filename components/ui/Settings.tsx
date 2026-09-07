import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import toast from "react-hot-toast";
import { User, Lock, Bell, Trash, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useConfirm } from "@/components/ui/confirm-provider";
import { NotificationSettings } from "./NotificationSettings";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import useCartStore from "@/store/cartStore";
import { useUser } from "@/providers/user/UserContext";
import { MultiLangInput } from "@/components/MultiLangInput/MultiLangInput";
import {
  hasAnyName,
  templateLabel,
  templateNames,
  type TemplateNames,
} from "@/lib/orderTemplates";

// Add this component before the SettingsComponent
const SettingsSkeleton = () => {
  return (
    <div className="space-y-6">
      <Card className="w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700">
        <CardHeader className="bg-[#535C91] dark:bg-[#6B74A9] p-6">
          <LoadingSkeleton height="h-8" width="w-48" className="bg-white/20" />
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <LoadingSkeleton height="h-5" width="w-32" />
                <LoadingSkeleton height="h-10" width="w-full" />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <LoadingSkeleton height="h-5" width="w-48" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <LoadingSkeleton key={i} height="h-10" width="w-full" />
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 dark:bg-gray-700/50 p-6 flex justify-end">
          <LoadingSkeleton height="h-10" width="w-32" />
        </CardFooter>
      </Card>
    </div>
  );
};

const Settings = () => {
  const { t, language } = useTranslation();
  const confirm = useConfirm();
  const { data: session, status } = useSession();
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);
  const { userData, loading: userLoading, refreshUserData } = useUser();
  const [personalInfo, setPersonalInfo] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [renamingListId, setRenamingListId] = useState<string | null>(null);
  const [renameNames, setRenameNames] = useState<TemplateNames>({
    en: "",
    "zh-TW": "",
  });

  const orderTemplates = userData?.orderTemplates ?? [];

  const renameList = async (id: string) => {
    if (!hasAnyName(renameNames)) return;

    try {
      await axios.put("/api/order-templates", {
        id,
        displayNames: renameNames,
      });
      await refreshUserData();
      setRenamingListId(null);
      setRenameNames({ en: "", "zh-TW": "" });
      toast.success(t("quick-order.listSaved"));
    } catch (error) {
      console.error("Error renaming saved list:", error);
      toast.error(t("quick-order.listSaveFailed"));
    }
  };

  const deleteList = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: t("common.delete"),
      description: t("quick-order.deleteConfirm", { name }),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
    });
    if (!confirmed) return;

    try {
      await axios.delete(`/api/order-templates?id=${id}`);
      await refreshUserData();
      toast.success(t("quick-order.listDeleted"));
    } catch (error) {
      console.error("Error deleting saved list:", error);
      toast.error(t("quick-order.listSaveFailed"));
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Use userData from context instead of fetching
  useEffect(() => {
    if (userData) {
      setPersonalInfo({
        name: userData.name || session?.user?.name || "",
        email: userData.email || session?.user?.email || "",
        phone: userData.phone || "",
      });
    }
  }, [userData, session]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword({ ...password, [e.target.name]: e.target.value });
  };

  const changePassword = async () => {
    if (!session?.user?.email) {
      toast.error(t("common.unauthorized"));
      return;
    }

    if (password.new !== password.confirm) {
      toast.error(t("common.passwordMismatch"));
      return;
    }

    setIsLoading(true);
    try {
      await axios.post("/api/change-password", {
        email: session.user.email,
        currentPassword: password.current,
        newPassword: password.new,
      });
      toast.success(t("common.passwordChanged"));
      setShowPasswordForm(false);
      setPassword({ current: "", new: "", confirm: "" });
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!session?.user?.email) {
      toast.error(t("common.unauthorized"));
      return;
    }

    const confirmed = await confirm({
      title: t("common.delete"),
      description: t("profile.settings.deleteAcc.warning"),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
    });
    if (confirmed) {
      setIsLoading(true);
      try {
        const res = await axios.delete("/api/delete-account");
        if (res.status === 200) {
          clearCart();
          toast.success(t("common.accountDeleted"));
          signOut({ callbackUrl: "/" });
        } else {
          throw new Error(t("common.error"));
        }
      } catch (error) {
        console.error("Error deleting account:", error);
        toast.error(t("common.error"));
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (status === "loading") {
    return <SettingsSkeleton />;
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <Card className="w-full shadow-lg rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl">
      <CardHeader className="bg-[#535C91] dark:bg-[#6B74A9] px-6 py-4">
        <h2 className="text-3xl font-bold text-white ml-0">
          {t("profile.settings.title")}
        </h2>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="flex p-0 bg-transparent border-b">
            <TabsTrigger
              value="personal"
              className="flex items-center space-x-2 px-6 py-4 ml-0 rounded-none border-b-2 border-transparent data-[state=active]:border-[#535C91] data-[state=active]:bg-transparent"
            >
              <User className="w-4 h-4" />
              <span>{t("profile.settings.personalInfo")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex items-center space-x-2 px-6 py-4 ml-0 rounded-none border-b-2 border-transparent data-[state=active]:border-[#535C91] data-[state=active]:bg-transparent"
            >
              <Lock className="w-4 h-4" />
              <span>{t("profile.settings.securitySettings")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center space-x-2 px-6 py-4 ml-0 rounded-none border-b-2 border-transparent data-[state=active]:border-[#535C91] data-[state=active]:bg-transparent"
            >
              <Bell className="w-4 h-4" />
              <span>{t("profile.settings.notificationSettings")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="orderLists"
              className="flex items-center space-x-2 px-6 py-4 ml-0 rounded-none border-b-2 border-transparent data-[state=active]:border-[#535C91] data-[state=active]:bg-transparent"
            >
              <ClipboardList className="w-4 h-4" />
              <span>{t("quick-order.savedLists")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="delete"
              className="flex items-center space-x-2 px-6 py-4 ml-0 rounded-none border-b-2 border-transparent data-[state=active]:border-[#535C91] data-[state=active]:bg-transparent"
            >
              <Trash className="w-4 h-4" />
              <span>{t("profile.settings.deleteAccount")}</span>
            </TabsTrigger>
          </TabsList>

          <div
            className="p-6"
            style={{
              backgroundColor: "hsla(var(--card), var(--card-opacity, 1))",
            }}
          >
            <TabsContent value="personal">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    {t("profile.settings.personalInfo")}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {t("profile.settings.personalInfoDescription")}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className="p-4 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
                    style={{
                      backgroundColor:
                        "hsla(var(--card), var(--card-opacity, 0.5))",
                    }}
                  >
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("profile.settings.form.fullName")}
                    </label>
                    <Input
                      value={personalInfo.name}
                      readOnly
                      className="bg-gray-50 dark:bg-gray-700/50"
                    />
                  </div>
                  <div
                    className="p-4 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
                    style={{
                      backgroundColor:
                        "hsla(var(--card), var(--card-opacity, 0.5))",
                    }}
                  >
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("profile.settings.form.email")}
                    </label>
                    <Input
                      value={personalInfo.email}
                      readOnly
                      className="bg-gray-50 dark:bg-gray-700/50"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {t("profile.settings.securitySettings")}
                  </CardTitle>
                  <CardDescription>
                    {t("profile.settings.securityDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {!showPasswordForm ? (
                      <div
                        className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer transition-colors duration-200 text-gray-700 dark:text-gray-300"
                        style={{
                          backgroundColor:
                            "hsla(var(--card), var(--card-opacity, 0.5))",
                        }}
                        onClick={() => setShowPasswordForm(true)}
                      >
                        {t("common.clickToUpdate")}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Input
                          name="current"
                          value={password.current}
                          onChange={handlePasswordChange}
                          placeholder={t("common.currentPassword")}
                          type="password"
                          className="bg-white dark:bg-gray-800"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            name="new"
                            value={password.new}
                            onChange={handlePasswordChange}
                            placeholder={t("common.newPassword")}
                            type="password"
                            className="bg-white dark:bg-gray-800"
                          />
                          <Input
                            name="confirm"
                            value={password.confirm}
                            onChange={handlePasswordChange}
                            placeholder={t("common.confirmPassword")}
                            type="password"
                            className="bg-white dark:bg-gray-800"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <Button
                            onClick={changePassword}
                            className="border bg-slate-100"
                            disabled={isLoading}
                          >
                            {isLoading
                              ? t("common.changingPassword")
                              : t("common.changePassword")}
                          </Button>
                          <Button
                            onClick={() => {
                              setShowPasswordForm(false);
                              setPassword({
                                current: "",
                                new: "",
                                confirm: "",
                              });
                            }}
                            className="text-gray-500 hover:text-gray-700"
                            variant="ghost"
                          >
                            {t("common.cancel")}
                          </Button>
                        </div>
                        <p className="text-xs">
                          {t("common.externalLoginNote")}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {t("profile.settings.notificationSettings")}
                  </CardTitle>
                  <CardDescription>
                    {t("profile.settings.notificationSettingsDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <NotificationSettings />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orderLists">
              <Card>
                <CardHeader>
                  <CardTitle>{t("quick-order.savedLists")}</CardTitle>
                  <CardDescription>
                    {t("quick-order.subtitle")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {orderTemplates.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t("quick-order.noSavedLists")}
                    </p>
                  ) : (
                    orderTemplates.map((template) => (
                      <div
                        key={template._id}
                        className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3"
                      >
                        {renamingListId === template._id ? (
                          <>
                            <div className="w-full">
                              <MultiLangInput
                                value={renameNames}
                                onChange={setRenameNames}
                                placeholder={{
                                  en: t("quick-order.listNamePlaceholderEn"),
                                  "zh-TW": t("quick-order.listNamePlaceholderZh"),
                                }}
                              />
                              <p className="mt-1 text-xs text-muted-foreground">
                                {t("quick-order.listNameBothHint")}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => renameList(template._id)}
                              disabled={!hasAnyName(renameNames)}
                            >
                              {t("common.save")}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setRenamingListId(null)}
                            >
                              {t("common.cancel")}
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-foreground">
                                {templateLabel(template, language)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {t("quick-order.listItemCount", {
                                  count: template.items.length,
                                })}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRenamingListId(template._id);
                                setRenameNames(templateNames(template));
                              }}
                            >
                              {t("quick-order.rename")}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                deleteList(
                                  template._id,
                                  templateLabel(template, language)
                                )
                              }
                            >
                              {t("common.delete")}
                            </Button>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
                <CardFooter>
                  <Link
                    href="/quick-order"
                    className="text-sm text-primary hover:underline"
                  >
                    {t("quick-order.openQuickOrder")}
                  </Link>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="delete">
              <Card>
                <CardHeader>
                  <CardTitle>{t("profile.settings.deleteAcc.title")}</CardTitle>
                  <CardDescription className="text-red-500">
                    {t("profile.settings.deleteAcc.deleteAccountWarning")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    onClick={deleteAccount}
                    className="w-full md:w-auto"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? t("common.deletingAccount")
                      : t("common.closeAccount")}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default Settings;

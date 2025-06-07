"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import { User as UserIcon, Mail, ShieldCheck, Edit2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import OrdersList from "@/components/ui/OrdersList";
import Wishlist from "@/components/ui/Wishlist";
import SettingsComponent from "@/components/ui/Settings";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "@/providers/language/LanguageContext";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get("tab") || "profile";
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    admin: false,
    role: "user",
  });

  useEffect(() => {
    if (session?.user) {
      setProfile({
        name: session.user.name || "",
        email: session.user.email || "",
        admin: session.user.admin || false,
        role: session.user.role || "user",
      });
    }
  }, [session]);

  const handleEdit = () => setIsEditing(true);

  const handleSave = async () => {
    setIsEditing(false);
    try {
      const res = await axios.put("/api/updateUser", {
        email: profile.email,
        name: profile.name,
        newEmail: profile.email,
      });

      if (res.status === 200) {
        await update({
          ...session,
          user: { ...session?.user, name: profile.name, email: profile.email },
        });
        setProfile((prevProfile) => ({
          ...prevProfile,
          name: profile.name,
          email: profile.email,
        }));
        toast.success(t("common.success"));
      } else {
        toast.error(t("common.error"));
      }
    } catch (error) {
      console.log(error);
      toast.error(t("common.error"));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const renderProfileContent = () => (
    <Card className="w-full bg-white dark:bg-gray-900 shadow-lg rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl">
      <CardHeader className="bg-[#535C91] dark:bg-[#6B74A9] p-6">
        <h2 className="text-3xl font-bold text-white">
          {t("common.personalInfo")}
        </h2>
      </CardHeader>
      <CardContent className="p-6 space-y-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {t("navigation.account")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("common.clickToUpdate")}
          </p>
        </div>
        <Separator className="my-4" />
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md">
            <UserIcon className="text-[#535C91] dark:text-[#6B74A9] w-6 h-6" />
            {isEditing ? (
              <Input
                name="name"
                value={profile.name}
                onChange={handleChange}
                className="flex-grow bg-white dark:bg-gray-800 border-2 border-[#535C91] dark:border-[#6B74A9] focus:border-[#535C91] dark:focus:border-[#6B74A9] rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100"
                placeholder={t("common.fullName")}
              />
            ) : (
              <span className="flex-grow text-lg font-medium text-gray-700 dark:text-gray-200">
                {profile.name}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md">
            <Mail className="text-[#535C91] dark:text-[#6B74A9] w-6 h-6" />
            {isEditing ? (
              <Input
                name="email"
                value={profile.email}
                onChange={handleChange}
                className="flex-grow bg-white dark:bg-gray-800 border-2 border-[#535C91] dark:border-[#6B74A9] focus:border-[#535C91] dark:focus:border-[#6B74A9] rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100"
                placeholder={t("common.email")}
              />
            ) : (
              <span className="flex-grow text-lg font-medium text-gray-700 dark:text-gray-200">
                {profile.email}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md">
            <ShieldCheck className="text-[#535C91] dark:text-[#6B74A9] w-6 h-6" />
            <span className="flex-grow text-lg font-medium text-gray-700 dark:text-gray-200">
              {t("common.role")}:{" "}
              {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              {profile.admin && ` (${t("navigation.admin")})`}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 dark:bg-gray-700/50 p-6 flex justify-end">
        {isEditing ? (
          <Button
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold flex items-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>{t("common.saveChanges")}</span>
          </Button>
        ) : (
          <Button
            onClick={handleEdit}
            className="bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91] text-white px-6 py-2 rounded-lg font-semibold flex items-center space-x-2"
          >
            <Edit2 className="w-5 h-5" />
            <span>{t("common.edit")}</span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  if (!session) {
    return <LoadingSkeleton />;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar variant="inset" />
      <SidebarInset className="!ml-0">
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col">
            <div className="p-4 md:p-6">
              {activeTab === "profile" && renderProfileContent()}
              {activeTab === "orders" && <OrdersList />}
              {activeTab === "wishlist" && <Wishlist />}
              {activeTab === "settings" && <SettingsComponent />}
            </div>
          </div>
        </div>
      </SidebarInset>
      <Toaster position="top-right" />
    </SidebarProvider>
  );
}

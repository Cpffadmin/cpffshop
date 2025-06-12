"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import {
  User as UserIcon,
  Mail,
  ShieldCheck,
  Edit2,
  Save,
  MapPin,
  Phone,
} from "lucide-react";
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
import { MultiLangInput } from "@/components/MultiLangInput/MultiLangInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatAddress } from "@/utils/formatAddress";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { WishlistButton } from "@/components/ui/WishlistButton";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const { t, language } = useTranslation();
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get("tab") || "profile";
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    admin: false,
    role: "user",
    phone: "",
    address: {
      room: { en: "", "zh-TW": "" },
      floor: { en: "", "zh-TW": "" },
      building: { en: "", "zh-TW": "" },
      street: { en: "", "zh-TW": "" },
      city: { en: "", "zh-TW": "" },
      state: { en: "", "zh-TW": "" },
      country: { en: "", "zh-TW": "" },
      postalCode: { en: "", "zh-TW": "" },
      formattedAddress: { en: "", "zh-TW": "" },
    },
  });

  const HK_DISTRICTS = [
    "Central and Western",
    "Eastern",
    "Southern",
    "Wan Chai",
    "Kowloon City",
    "Kwun Tong",
    "Sham Shui Po",
    "Wong Tai Sin",
    "Yau Tsim Mong",
    "Islands",
    "Kwai Tsing",
    "North",
    "Sai Kung",
    "Sha Tin",
    "Tai Po",
    "Tsuen Wan",
    "Tuen Mun",
    "Yuen Long",
  ];

  const LOCATIONS = ["Hong Kong Island", "Kowloon", "New Territories"];

  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user) {
        try {
          console.log("Fetching user data...");
          const response = await axios.get("/api/userData");
          console.log("User data received:", response.data);
          const userData = response.data;

          const newProfile = {
            name: userData.name || session.user.name || "",
            email: userData.email || session.user.email || "",
            admin: userData.admin || session.user.admin || false,
            role: userData.role || session.user.role || "user",
            phone: userData.phone || session.user.phone || "",
            address: userData.address || {
              room: { en: "", "zh-TW": "" },
              floor: { en: "", "zh-TW": "" },
              building: { en: "", "zh-TW": "" },
              street: { en: "", "zh-TW": "" },
              city: { en: "", "zh-TW": "" },
              state: { en: "", "zh-TW": "" },
              country: { en: "", "zh-TW": "" },
              postalCode: { en: "", "zh-TW": "" },
              formattedAddress: { en: "", "zh-TW": "" },
            },
          };
          console.log("Setting profile to:", newProfile);
          setProfile(newProfile);
        } catch (error) {
          console.error("Error fetching user data:", error);
          if (error instanceof Error && "response" in error) {
            const axiosError = error as { response?: { data: unknown } };
            console.error("Error details:", axiosError.response?.data);
          }
          toast.error(t("common.error"));
          // Fallback to session data if API fails
          setProfile({
            name: session.user.name || "",
            email: session.user.email || "",
            admin: session.user.admin || false,
            role: session.user.role || "user",
            phone: session.user.phone || "",
            address: {
              room: { en: "", "zh-TW": "" },
              floor: { en: "", "zh-TW": "" },
              building: { en: "", "zh-TW": "" },
              street: { en: "", "zh-TW": "" },
              city: { en: "", "zh-TW": "" },
              state: { en: "", "zh-TW": "" },
              country: { en: "", "zh-TW": "" },
              postalCode: { en: "", "zh-TW": "" },
              formattedAddress: { en: "", "zh-TW": "" },
            },
          });
        }
      }
    };

    fetchUserData();
  }, [session, t]);

  const handleEdit = () => setIsEditing(true);

  const handleSave = async () => {
    setIsEditing(false);
    try {
      const res = await axios.put("/api/updateUser", {
        email: profile.email,
        name: profile.name,
        newEmail: profile.email,
        phone: profile.phone,
        address: profile.address,
      });

      if (res.status === 200) {
        await update({
          ...session,
          user: {
            ...session?.user,
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            address: profile.address,
          },
        });
        setProfile((prevProfile) => ({
          ...prevProfile,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
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

  const handleAddressChange = (field: string, value: any) => {
    setProfile((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
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
            <Phone className="text-[#535C91] dark:text-[#6B74A9] w-6 h-6" />
            {isEditing ? (
              <Input
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                className="flex-grow bg-white dark:bg-gray-800 border-2 border-[#535C91] dark:border-[#6B74A9] focus:border-[#535C91] dark:focus:border-[#6B74A9] rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100"
                placeholder={t("common.phone")}
              />
            ) : (
              <span className="flex-grow text-lg font-medium text-gray-700 dark:text-gray-200">
                {profile.phone || t("common.noPhoneNumber")}
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

        <Separator className="my-4" />

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {t("common.address")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isEditing ? (
              <>
                <div className="space-y-4">
                  <MultiLangInput
                    label={t("common.room")}
                    value={profile.address.room}
                    onChange={(value) => handleAddressChange("room", value)}
                    placeholder={{ en: "Room number", "zh-TW": "室號" }}
                  />
                  <MultiLangInput
                    label={t("common.floor")}
                    value={profile.address.floor}
                    onChange={(value) => handleAddressChange("floor", value)}
                    placeholder={{ en: "Floor", "zh-TW": "樓層" }}
                  />
                  <MultiLangInput
                    label={t("common.building")}
                    value={profile.address.building}
                    onChange={(value) => handleAddressChange("building", value)}
                    placeholder={{ en: "Building name", "zh-TW": "大廈名稱" }}
                  />
                  <MultiLangInput
                    label={t("common.street")}
                    value={profile.address.street}
                    onChange={(value) => handleAddressChange("street", value)}
                    placeholder={{ en: "Street address", "zh-TW": "街道地址" }}
                  />
                  <MultiLangInput
                    label={t("common.city")}
                    value={profile.address.city}
                    onChange={(value) => handleAddressChange("city", value)}
                    placeholder={{ en: "City", "zh-TW": "城市" }}
                  />
                  <MultiLangInput
                    label={t("common.state")}
                    value={profile.address.state}
                    onChange={(value) => handleAddressChange("state", value)}
                    placeholder={{ en: "State/Region", "zh-TW": "州/地區" }}
                  />
                  <MultiLangInput
                    label={t("common.country")}
                    value={profile.address.country}
                    onChange={(value) => handleAddressChange("country", value)}
                    placeholder={{ en: "Country", "zh-TW": "國家" }}
                  />
                  <MultiLangInput
                    label={t("common.postalCode")}
                    value={profile.address.postalCode}
                    onChange={(value) =>
                      handleAddressChange("postalCode", value)
                    }
                    placeholder={{ en: "Postal code", "zh-TW": "郵遞區號" }}
                  />
                </div>
              </>
            ) : (
              <div className="col-span-2 space-y-4">
                {profile.address && Object.keys(profile.address).length > 0 ? (
                  <div className="flex items-start space-x-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg shadow-sm">
                    <MapPin className="text-[#535C91] dark:text-[#6B74A9] w-6 h-6 mt-1" />
                    <div className="flex-grow space-y-2">
                      <div className="text-lg font-medium text-gray-700 dark:text-gray-200">
                        {
                          formatAddress({
                            room: {
                              en: profile.address.room?.en,
                              "zh-TW": profile.address.room?.["zh-TW"],
                            },
                            floor: {
                              en: profile.address.floor?.en,
                              "zh-TW": profile.address.floor?.["zh-TW"],
                            },
                            building: {
                              en: `${
                                profile.address.building?.en || ""
                              }`.trim(),
                              "zh-TW": `${
                                profile.address.building?.["zh-TW"] || ""
                              }`.trim(),
                            },
                            street: {
                              en: `${profile.address.street?.en || ""}`.trim(),
                              "zh-TW": `${
                                profile.address.street?.["zh-TW"] || ""
                              }`.trim(),
                            },
                            city: {
                              en: profile.address.city?.en || "",
                              "zh-TW": profile.address.city?.["zh-TW"] || "",
                            },
                            state: {
                              en: profile.address.state?.en || "",
                              "zh-TW": profile.address.state?.["zh-TW"] || "",
                            },
                            country: {
                              en: profile.address.country?.en || "",
                              "zh-TW": profile.address.country?.["zh-TW"] || "",
                            },
                            postalCode: {
                              en: profile.address.postalCode?.en || "",
                              "zh-TW":
                                profile.address.postalCode?.["zh-TW"] || "",
                            },
                          })[language]
                        }
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 text-center p-4">
                    {t("common.noAddress")}
                  </div>
                )}
              </div>
            )}
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

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

const emptyAddress = {
  roomFlat: { en: "", "zh-TW": "" },
  floor: { en: "", "zh-TW": "" },
  blockNumber: { en: "", "zh-TW": "" },
  blockName: { en: "", "zh-TW": "" },
  buildingName: { en: "", "zh-TW": "" },
  streetNumber: { en: "", "zh-TW": "" },
  streetName: { en: "", "zh-TW": "" },
  district: { en: "", "zh-TW": "" },
  location: { en: "", "zh-TW": "" },
  formattedAddress: { en: "", "zh-TW": "" },
};

// Move emptyAddress outside of the component to avoid recreation on each render
const EMPTY_ADDRESS = Object.freeze(emptyAddress);

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
    address: EMPTY_ADDRESS,
  });

  const HK_DISTRICTS = [
    {
      en: "Central and Western",
      "zh-TW": "中西區",
    },
    {
      en: "Eastern",
      "zh-TW": "東區",
    },
    {
      en: "Southern",
      "zh-TW": "南區",
    },
    {
      en: "Wan Chai",
      "zh-TW": "灣仔區",
    },
    {
      en: "Kowloon City",
      "zh-TW": "九龍城區",
    },
    {
      en: "Kwun Tong",
      "zh-TW": "觀塘區",
    },
    {
      en: "Sham Shui Po",
      "zh-TW": "深水埗區",
    },
    {
      en: "Wong Tai Sin",
      "zh-TW": "黃大仙區",
    },
    {
      en: "Yau Tsim Mong",
      "zh-TW": "油尖旺區",
    },
    {
      en: "Islands",
      "zh-TW": "離島區",
    },
    {
      en: "Kwai Tsing",
      "zh-TW": "葵青區",
    },
    {
      en: "North",
      "zh-TW": "北區",
    },
    {
      en: "Sai Kung",
      "zh-TW": "西貢區",
    },
    {
      en: "Sha Tin",
      "zh-TW": "沙田區",
    },
    {
      en: "Tai Po",
      "zh-TW": "大埔區",
    },
    {
      en: "Tsuen Wan",
      "zh-TW": "荃灣區",
    },
    {
      en: "Tuen Mun",
      "zh-TW": "屯門區",
    },
    {
      en: "Yuen Long",
      "zh-TW": "元朗區",
    },
  ];

  const LOCATIONS = [
    {
      en: "Hong Kong Island",
      "zh-TW": "香港島",
    },
    {
      en: "Kowloon",
      "zh-TW": "九龍",
    },
    {
      en: "New Territories",
      "zh-TW": "新界",
    },
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user) {
        try {
          console.log("Fetching user data...");
          const response = await axios.get("/api/userData");
          console.log("User data received:", response.data);
          const userData = response.data;

          // Ensure address fields are properly initialized
          const address = userData.address || EMPTY_ADDRESS;
          Object.keys(EMPTY_ADDRESS).forEach((key) => {
            if (!address[key]) {
              address[key] = { en: "", "zh-TW": "" };
            }
          });

          const newProfile = {
            name: userData.name || session.user.name || "",
            email: userData.email || session.user.email || "",
            admin: userData.admin || session.user.admin || false,
            role: userData.role || session.user.role || "user",
            phone: userData.phone || session.user.phone || "",
            address,
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
            address: EMPTY_ADDRESS,
          });
        }
      }
    };

    fetchUserData();
  }, [session, t]); // We don't need EMPTY_ADDRESS in deps as it's now constant

  const handleEdit = () => setIsEditing(true);

  const handleAddressChange = (field: string, value: any) => {
    setProfile((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

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
          {isEditing ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <MultiLangInput
                  label={t("common.roomFlat")}
                  value={profile.address.roomFlat}
                  onChange={(value) => handleAddressChange("roomFlat", value)}
                  placeholder={{ en: "Room/Flat", "zh-TW": "室/單位" }}
                />
                <MultiLangInput
                  label={t("common.floor")}
                  value={profile.address.floor}
                  onChange={(value) => handleAddressChange("floor", value)}
                  placeholder={{ en: "Floor", "zh-TW": "樓層" }}
                />
                <MultiLangInput
                  label={t("common.blockNumber")}
                  value={profile.address.blockNumber}
                  onChange={(value) =>
                    handleAddressChange("blockNumber", value)
                  }
                  placeholder={{ en: "Block Number", "zh-TW": "座數" }}
                />
                <MultiLangInput
                  label={t("common.blockName")}
                  value={profile.address.blockName}
                  onChange={(value) => handleAddressChange("blockName", value)}
                  placeholder={{ en: "Block Name", "zh-TW": "座名" }}
                />
                <MultiLangInput
                  label={t("common.buildingName")}
                  value={profile.address.buildingName}
                  onChange={(value) =>
                    handleAddressChange("buildingName", value)
                  }
                  placeholder={{ en: "Building Name", "zh-TW": "大廈名稱" }}
                />
                <MultiLangInput
                  label={t("common.streetNumber")}
                  value={profile.address.streetNumber}
                  onChange={(value) =>
                    handleAddressChange("streetNumber", value)
                  }
                  placeholder={{ en: "Street Number", "zh-TW": "街號" }}
                />
                <MultiLangInput
                  label={t("common.streetName")}
                  value={profile.address.streetName}
                  onChange={(value) => handleAddressChange("streetName", value)}
                  placeholder={{ en: "Street Name", "zh-TW": "街道名稱" }}
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    {t("common.district")}
                  </label>
                  <Select
                    value={profile.address?.district?.en || HK_DISTRICTS[0].en}
                    onValueChange={(value) => {
                      const district =
                        HK_DISTRICTS.find((d) => d.en === value) ||
                        HK_DISTRICTS[0];
                      handleAddressChange("district", district);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("common.selectDistrict")} />
                    </SelectTrigger>
                    <SelectContent>
                      {HK_DISTRICTS.map((district) => (
                        <SelectItem key={district.en} value={district.en}>
                          {language === "en" ? district.en : district["zh-TW"]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    {t("common.location")}
                  </label>
                  <Select
                    value={profile.address?.location?.en || LOCATIONS[0].en}
                    onValueChange={(value) => {
                      const location =
                        LOCATIONS.find((l) => l.en === value) || LOCATIONS[0];
                      handleAddressChange("location", location);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("common.selectLocation")} />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((location) => (
                        <SelectItem key={location.en} value={location.en}>
                          {language === "en" ? location.en : location["zh-TW"]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          ) : (
            <div className="col-span-2 space-y-4">
              <div className="flex items-start space-x-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg shadow-sm">
                <MapPin className="text-[#535C91] dark:text-[#6B74A9] w-6 h-6 mt-1" />
                <div className="flex-grow space-y-2">
                  {profile.address.roomFlat?.en ||
                  profile.address.floor?.en ||
                  profile.address.blockNumber?.en ||
                  profile.address.blockName?.en ||
                  profile.address.buildingName?.en ||
                  profile.address.streetNumber?.en ||
                  profile.address.streetName?.en ||
                  profile.address.district?.en ||
                  profile.address.location?.en ? (
                    <>
                      <div className="text-lg font-medium text-gray-700 dark:text-gray-200">
                        {language === "en" ? (
                          <>
                            {profile.address.roomFlat?.en &&
                              `Room ${profile.address.roomFlat.en}, `}
                            {profile.address.floor?.en &&
                              `${profile.address.floor.en}/F, `}
                            {profile.address.blockNumber?.en &&
                              `Block ${profile.address.blockNumber.en}, `}
                            {profile.address.blockName?.en &&
                              `${profile.address.blockName.en}, `}
                            {profile.address.buildingName?.en &&
                              `${profile.address.buildingName.en}, `}
                            {profile.address.streetNumber?.en &&
                              `${profile.address.streetNumber.en} `}
                            {profile.address.streetName?.en &&
                              `${profile.address.streetName.en}, `}
                            {profile.address.district?.en &&
                              `${profile.address.district.en}, `}
                            {profile.address.location?.en &&
                              profile.address.location.en}
                          </>
                        ) : (
                          <>
                            {profile.address.location?.["zh-TW"] &&
                              `${profile.address.location["zh-TW"]} `}
                            {profile.address.district?.["zh-TW"] &&
                              `${profile.address.district["zh-TW"]} `}
                            {profile.address.streetName?.["zh-TW"] &&
                              `${profile.address.streetName["zh-TW"]} `}
                            {profile.address.streetNumber?.["zh-TW"] &&
                              `${profile.address.streetNumber["zh-TW"]} `}
                            {profile.address.buildingName?.["zh-TW"] &&
                              `${profile.address.buildingName["zh-TW"]} `}
                            {profile.address.blockName?.["zh-TW"] &&
                              `${profile.address.blockName["zh-TW"]} `}
                            {profile.address.blockNumber?.["zh-TW"] &&
                              `${profile.address.blockNumber["zh-TW"]}座 `}
                            {profile.address.floor?.["zh-TW"] &&
                              `${profile.address.floor["zh-TW"]}樓 `}
                            {profile.address.roomFlat?.["zh-TW"] &&
                              `${profile.address.roomFlat["zh-TW"]}室`}
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 text-center">
                      {t("common.noAddress")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
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

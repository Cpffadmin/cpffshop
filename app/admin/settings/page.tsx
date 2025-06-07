"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { LayoutDashboard, Settings as SettingsIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/providers/language/LanguageContext";
import {
  CldUploadButton,
  CloudinaryUploadWidgetResults,
  CloudinaryUploadWidgetInfo,
} from "next-cloudinary";
import Image, { StaticImageData } from "next/image";
import axios from "axios";
import toast from "react-hot-toast";
import { useStore } from "@/providers/store/StoreContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import Script from "next/script";
import {
  MultiLangInput,
  MultiLangDisplay,
} from "@/components/MultiLangInput/MultiLangInput";
import router from "next/router";

interface MultiLangValue {
  en: string;
  "zh-TW": string;
}

interface OfficeLocation {
  name: MultiLangValue;
  address: MultiLangValue;
  phone: string;
  email: string;
  hours: MultiLangValue;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface ContactInfo {
  email: string;
  phone: string;
  address: {
    street: MultiLangValue;
    city: MultiLangValue;
    postalCode: MultiLangValue;
    country: MultiLangValue;
  };
}

interface StoreSettings {
  storeName: MultiLangValue;
  logo: string | StaticImageData;
  contactInfo: ContactInfo;
  businessHours: {
    weekdays: MultiLangValue;
    weekends: MultiLangValue;
  };
  socialMedia: {
    facebook: string;
    instagram: string;
    twitter: string;
  };
  shippingInfo: {
    standardDays: string;
    expressDays: string;
    internationalShipping: boolean;
    show?: boolean;
    title?: MultiLangValue;
    standardShipping?: MultiLangValue;
    expressShipping?: MultiLangValue;
  };
  returnPolicy: {
    daysToReturn: number;
    conditions: MultiLangValue;
    show?: boolean;
    title?: MultiLangValue;
  };
  newsletterSettings: {
    title: MultiLangValue;
    subtitle: MultiLangValue;
    bannerImage: string;
    discountPercentage: number;
    buttonText: MultiLangValue;
    disclaimer: MultiLangValue;
  };
  aboutPage: {
    title: MultiLangValue;
    subtitle: MultiLangValue;
    bannerImage: string;
    story: {
      title: MultiLangValue;
      content: MultiLangValue;
      image: string;
    };
    values: {
      title: MultiLangValue;
      items: {
        title: MultiLangValue;
        description: MultiLangValue;
        icon: string;
      }[];
    };
    team: {
      title: MultiLangValue;
      members: {
        name: MultiLangValue;
        role: MultiLangValue;
        image: string;
        description: MultiLangValue;
      }[];
    };
  };
  contactPage: {
    title: MultiLangValue;
    subtitle: MultiLangValue;
    bannerImage: string;
    contactInfo: {
      title: MultiLangValue;
      officeLocations: ContactPageOfficeLocation[];
    };
    supportChannels: {
      title: MultiLangValue;
      image: string;
      channels: ContactPageChannel[];
    };
    faq: {
      title: MultiLangValue;
      questions: {
        question: MultiLangValue;
        answer: MultiLangValue;
      }[];
    };
  };
  slogan: MultiLangValue;
  copyright: MultiLangValue;
}

interface AboutPageStory {
  title: MultiLangValue;
  content: MultiLangValue;
  image: string;
}

interface AboutPageValue {
  title: MultiLangValue;
  description: MultiLangValue;
  icon: string;
}

interface AboutPageTeamMember {
  name: MultiLangValue;
  role: MultiLangValue;
  image: string;
  description: MultiLangValue;
}

interface AboutPageValues {
  title: MultiLangValue;
  items: AboutPageValue[];
}

interface AboutPageTeam {
  title: MultiLangValue;
  members: AboutPageTeamMember[];
}

interface AboutPage {
  title: MultiLangValue;
  subtitle: MultiLangValue;
  bannerImage: string;
  story: AboutPageStory;
  values: AboutPageValues;
  team: AboutPageTeam;
}

interface ContactPageOfficeLocation {
  name: MultiLangValue;
  address: MultiLangValue;
  phone: string;
  email: string;
  hours: MultiLangValue;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface ContactPageChannel {
  title: MultiLangValue;
  description: MultiLangValue;
  icon: string;
}

interface ContactPageQuestion {
  question: MultiLangValue;
  answer: MultiLangValue;
}

interface ContactPageInfo {
  title: MultiLangValue;
  officeLocations: ContactPageOfficeLocation[];
}

interface ContactPageChannels {
  title: MultiLangValue;
  image: string;
  channels: ContactPageChannel[];
}

interface ContactPageFAQ {
  title: MultiLangValue;
  questions: ContactPageQuestion[];
}

interface ContactPage {
  title: MultiLangValue;
  subtitle: MultiLangValue;
  bannerImage: string;
  contactInfo: ContactPageInfo;
  supportChannels: ContactPageChannels;
  faq: ContactPageFAQ;
}

type ArrayItem =
  | ContactPageOfficeLocation
  | ContactPageChannel
  | ContactPageQuestion
  | AboutPageTeamMember
  | AboutPageValue;

type AboutPageSectionData = AboutPageStory | AboutPageValues | AboutPageTeam;
type ContactPageSectionData =
  | ContactPageInfo
  | ContactPageChannels
  | ContactPageFAQ;

type SectionType = {
  aboutPage: {
    title: MultiLangValue;
    subtitle: MultiLangValue;
    bannerImage: string;
    story: AboutPageStory;
    values: AboutPageValues;
    team: AboutPageTeam;
  };
  contactPage: {
    title: MultiLangValue;
    subtitle: MultiLangValue;
    bannerImage: string;
    contactInfo: ContactPageInfo;
    supportChannels: ContactPageChannels;
    faq: ContactPageFAQ;
  };
};

type SubsectionType = {
  [K in keyof SectionType]: keyof SectionType[K];
};

type SectionKey = keyof SectionType;
type SubsectionKey<T extends SectionKey> = keyof SectionType[T];

const isAboutPageSection = (
  section: unknown
): section is AboutPageSectionData => {
  return (
    typeof section === "object" &&
    section !== null &&
    ("content" in section || "items" in section || "members" in section)
  );
};

const isContactPageSection = (
  section: unknown
): section is ContactPageSectionData => {
  return (
    typeof section === "object" &&
    section !== null &&
    ("officeLocations" in section ||
      "channels" in section ||
      "questions" in section)
  );
};

const getArrayData = (
  section: unknown,
  arrayName: string
): ArrayItem[] | undefined => {
  if (
    section &&
    typeof section === "object" &&
    arrayName in section &&
    Array.isArray((section as Record<string, unknown>)[arrayName])
  ) {
    return (section as Record<string, ArrayItem[]>)[arrayName];
  }
  return undefined;
};

function isCloudinarySuccess(
  result: CloudinaryUploadWidgetResults
): result is { event: "success"; info: CloudinaryUploadWidgetInfo } {
  return (
    result?.event === "success" &&
    typeof result.info === "object" &&
    result.info !== null &&
    "secure_url" in result.info &&
    typeof result.info.secure_url === "string"
  );
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, getMultiLangValue } = useTranslation();
  const { refreshSettings } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("general"); // Add state for active tab
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: {
      en: "EcomWatch",
      "zh-TW": "EcomWatch",
    },
    slogan: {
      en: "Your Luxury Watch Destination",
      "zh-TW": "您的奢華手錶目的地",
    },
    copyright: {
      en: "© 2024 EcomWatch. All rights reserved.",
      "zh-TW": "© 2024 EcomWatch. 保留所有權利。",
    },
    logo: "/logo.png",
    contactInfo: {
      email: "support@ecomwatch.com",
      phone: "(123) 456-7890",
      address: {
        street: {
          en: "123 Watch Street",
          "zh-TW": "123 手錶街",
        },
        city: {
          en: "Timepiece City",
          "zh-TW": "時鐘城",
        },
        postalCode: {
          en: "TC 12345",
          "zh-TW": "TC 12345",
        },
        country: {
          en: "Switzerland",
          "zh-TW": "瑞士",
        },
      },
    },
    businessHours: {
      weekdays: {
        en: "Mon-Fri: 9am-6pm",
        "zh-TW": "週一至週五: 上午9點至下午6點",
      },
      weekends: {
        en: "Sat-Sun: 10am-4pm",
        "zh-TW": "週六至週日: 上午10點至下午4點",
      },
    },
    socialMedia: {
      facebook: "",
      instagram: "",
      twitter: "",
    },
    shippingInfo: {
      standardDays: "5-7 business days",
      expressDays: "2-3 business days",
      internationalShipping: true,
      show: true,
      title: {
        en: "Shipping",
        "zh-TW": "運送",
      },
      standardShipping: {
        en: "Standard Shipping",
        "zh-TW": "標準運送",
      },
      expressShipping: {
        en: "Express Shipping",
        "zh-TW": "快速運送",
      },
    },
    returnPolicy: {
      daysToReturn: 30,
      conditions: {
        en: "Items must be unworn and in original condition with all tags attached.",
        "zh-TW": "商品必須未使用且保持原始狀態，所有標籤必須完整。",
      },
      show: true,
      title: {
        en: "Return Policy",
        "zh-TW": "退貨政策",
      },
    },
    newsletterSettings: {
      title: {
        en: "Subscribe to Our Newsletter",
        "zh-TW": "訂閱我們的電子報",
      },
      subtitle: {
        en: "Get 15% off your first order!",
        "zh-TW": "首次訂單可享85折優惠！",
      },
      bannerImage: "/newsletter.jpg",
      discountPercentage: 15,
      buttonText: {
        en: "Subscribe Now",
        "zh-TW": "立即訂閱",
      },
      disclaimer: {
        en: "By subscribing, you agree to receive email marketing. You can unsubscribe at any time.",
        "zh-TW": "訂閱即表示您同意接收電子郵件行銷。您可以隨時取消訂閱。",
      },
    },
    aboutPage: {
      title: {
        en: "About Us",
        "zh-TW": "關於我們",
      },
      subtitle: {
        en: "Our Story",
        "zh-TW": "我們的故事",
      },
      bannerImage: "/about-banner.jpg",
      story: {
        title: {
          en: "Our Story",
          "zh-TW": "我們的故事",
        },
        content: {
          en: "We've been in the business for over 20 years...",
          "zh-TW": "我們在這個行業已經超過20年...",
        },
        image: "/story-image.jpg",
      },
      values: {
        title: {
          en: "Our Values",
          "zh-TW": "我們的價值觀",
        },
        items: [
          {
            title: {
              en: "Innovation",
              "zh-TW": "創新",
            },
            description: {
              en: "We're always looking for new ways to improve",
              "zh-TW": "我們一直在尋找改進的新方法",
            },
            icon: "innovation.png",
          },
          {
            title: {
              en: "Quality",
              "zh-TW": "品質",
            },
            description: {
              en: "We're committed to the highest quality",
              "zh-TW": "我們致力於最高品質",
            },
            icon: "quality.png",
          },
          {
            title: {
              en: "Customer Service",
              "zh-TW": "客戶服務",
            },
            description: {
              en: "We're here to help you",
              "zh-TW": "我們在這裡為您服務",
            },
            icon: "customer-service.png",
          },
        ],
      },
      team: {
        title: {
          en: "Our Team",
          "zh-TW": "我們的團隊",
        },
        members: [
          {
            name: {
              en: "John Doe",
              "zh-TW": "John Doe",
            },
            role: {
              en: "CEO",
              "zh-TW": "執行長",
            },
            image: "/john-doe.jpg",
            description: {
              en: "John is the visionary behind our company",
              "zh-TW": "John是我們公司背後的遠見者",
            },
          },
          {
            name: {
              en: "Jane Smith",
              "zh-TW": "Jane Smith",
            },
            role: {
              en: "COO",
              "zh-TW": "營運長",
            },
            image: "/jane-smith.jpg",
            description: {
              en: "Jane is responsible for our operations",
              "zh-TW": "Jane負責我們的營運",
            },
          },
        ],
      },
    },
    contactPage: {
      title: { en: "", "zh-TW": "" },
      subtitle: { en: "", "zh-TW": "" },
      bannerImage: "",
      contactInfo: {
        title: { en: "", "zh-TW": "" },
        officeLocations: [
          {
            name: { en: "", "zh-TW": "" },
            address: { en: "", "zh-TW": "" },
            phone: "",
            email: "",
            hours: { en: "", "zh-TW": "" },
            coordinates: {
              lat: 0,
              lng: 0,
            },
          },
        ],
      },
      supportChannels: {
        title: { en: "", "zh-TW": "" },
        image: "",
        channels: [
          {
            title: { en: "", "zh-TW": "" },
            description: { en: "", "zh-TW": "" },
            icon: "",
          },
        ],
      },
      faq: {
        title: { en: "", "zh-TW": "" },
        questions: [
          {
            question: { en: "", "zh-TW": "" },
            answer: { en: "", "zh-TW": "" },
          },
        ],
      },
    },
  });

  const breadcrumbItems = [
    {
      label: t("navigation.admin"),
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      label: t("navigation.settings"),
      href: "/admin/settings",
      icon: SettingsIcon,
    },
  ];

  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !session?.user?.admin) {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("/api/store-settings");
        setSettings(response.data);
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.admin) {
      fetchSettings();
    }
  }, [session]);

  const handleInputChange = (
    value:
      | MultiLangValue
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    section?: string
  ) => {
    if ("target" in value) {
      // Handle regular input change
      const { name, value: inputValue } = value.target;
      setSettings((prev) => {
        const newSettings = { ...prev };

        // Handle social media fields directly
        if (name.startsWith("socialMedia.")) {
          const field = name.split(".")[1];
          newSettings.socialMedia = {
            ...newSettings.socialMedia,
            [field]: inputValue,
          };
          return newSettings;
        }

        // Special cases for non-multilingual fields
        const nonMultiLangFields = [
          "icon",
          "image",
          "bannerImage",
          "logo",
          "discountPercentage",
          "daysToReturn",
          "internationalShipping",
          "phone",
          "email",
          "coordinates.lat",
          "coordinates.lng",
        ];

        // Check if this is a coordinates field
        const isCoordinates = name.includes("coordinates.");

        // Function to check if field should be multilingual
        const shouldBeMultiLingual = (fieldName: string) => {
          return !nonMultiLangFields.some(
            (field) => fieldName.includes(field) || fieldName.endsWith(field)
          );
        };

        if (section) {
          const parts = name.split(".");
          let current: any = newSettings[section as keyof typeof newSettings];

          // Handle array items (like officeLocations)
          if (parts.length > 2 && /\d+/.test(parts[1])) {
            const [arrayName, indexStr, ...rest] = parts;
            const index = parseInt(indexStr);
            const fieldName = rest.join(".");

            if (arrayName === "contactInfo.officeLocations") {
              const locations = [...current.contactInfo.officeLocations];

              if (isCoordinates) {
                // Handle coordinates separately
                const coordField = fieldName.split(".")[1];
                if (!locations[index].coordinates) {
                  locations[index].coordinates = { lat: 0, lng: 0 };
                }
                locations[index].coordinates[coordField as "lat" | "lng"] =
                  parseFloat(inputValue) || 0;
              } else if (shouldBeMultiLingual(fieldName)) {
                // Handle multilingual fields
                locations[index][fieldName] = {
                  en: inputValue,
                  "zh-TW": inputValue,
                };
              } else {
                // Handle non-multilingual fields
                locations[index][fieldName] = inputValue;
              }

              current.contactInfo.officeLocations = locations;
            }
          } else {
            // Handle non-array fields
            for (let i = 0; i < parts.length - 1; i++) {
              current = current[parts[i]];
            }

            const lastPart = parts[parts.length - 1];
            if (shouldBeMultiLingual(lastPart)) {
              current[lastPart] = {
                en: inputValue,
                "zh-TW": inputValue,
              };
            } else {
              current[lastPart] = inputValue;
            }
          }
        }

        return newSettings;
      });
    } else {
      // Handle MultiLangInput change
      setSettings((prev) => {
        if (!section) return prev;

        const newSettings = { ...prev };
        const sectionPath = section.split(".");
        let current: any = newSettings;

        for (let i = 0; i < sectionPath.length - 1; i++) {
          current = current[sectionPath[i]];
        }

        const lastKey = sectionPath[sectionPath.length - 1];
        current[lastKey] = value;

        return newSettings;
      });
    }
  };

  const handleLogoUpload = (result: CloudinaryUploadWidgetResults) => {
    if (isCloudinarySuccess(result)) {
      setSettings((prev) => ({
        ...prev,
        logo: result.info.secure_url,
      }));
      toast.success("Logo uploaded successfully");
    } else {
      toast.error("Failed to upload logo");
    }
  };

  const handleNewsletterBannerUpload = (
    result: CloudinaryUploadWidgetResults
  ) => {
    if (isCloudinarySuccess(result)) {
      setSettings((prev) => ({
        ...prev,
        newsletterSettings: {
          ...prev.newsletterSettings,
          bannerImage: result.info.secure_url,
        },
      }));
      toast.success("Newsletter banner uploaded successfully");
    } else {
      toast.error("Failed to upload newsletter banner");
    }
  };

  const handleAboutBannerUpload = (result: CloudinaryUploadWidgetResults) => {
    if (isCloudinarySuccess(result)) {
      setSettings((prev) => ({
        ...prev,
        aboutPage: {
          ...prev.aboutPage,
          bannerImage: result.info.secure_url,
        },
      }));
      toast.success("About page banner uploaded successfully");
    } else {
      toast.error("Failed to upload about page banner");
    }
  };

  const handleStoryImageUpload = (result: CloudinaryUploadWidgetResults) => {
    if (isCloudinarySuccess(result)) {
      setSettings((prev) => ({
        ...prev,
        aboutPage: {
          ...prev.aboutPage,
          story: {
            ...prev.aboutPage.story,
            image: result.info.secure_url,
          },
        },
      }));
      toast.success("Story image uploaded successfully");
    } else {
      toast.error("Failed to upload story image");
    }
  };

  const handleTeamMemberImageUpload = (
    result: CloudinaryUploadWidgetResults,
    index: number
  ) => {
    if (isCloudinarySuccess(result)) {
      setSettings((prev) => {
        const newMembers = [...prev.aboutPage.team.members];
        // Preserve all existing member data and only update the image
        newMembers[index] = {
          ...newMembers[index], // Keep all existing data
          image: result.info.secure_url, // Only update the image
        };

        return {
          ...prev,
          aboutPage: {
            ...prev.aboutPage,
            team: {
              ...prev.aboutPage.team,
              members: newMembers,
            },
          },
        };
      });

      toast.success("Team member image uploaded successfully");
    } else {
      toast.error("Failed to upload team member image");
    }
  };

  const handleContactBannerUpload = (result: CloudinaryUploadWidgetResults) => {
    if (isCloudinarySuccess(result)) {
      setSettings((prev) => ({
        ...prev,
        contactPage: {
          ...prev.contactPage,
          bannerImage: result.info.secure_url,
        },
      }));
      toast.success("Contact page banner uploaded successfully");
    } else {
      toast.error("Failed to upload contact page banner");
    }
  };

  const handleSupportChannelsImageUpload = (
    result: CloudinaryUploadWidgetResults
  ) => {
    if (isCloudinarySuccess(result)) {
      setSettings((prev) => ({
        ...prev,
        contactPage: {
          ...prev.contactPage,
          supportChannels: {
            ...prev.contactPage.supportChannels,
            image: result.info.secure_url,
          },
        },
      }));
      toast.success("Support channels image uploaded successfully");
    } else {
      toast.error("Failed to upload support channels image");
    }
  };

  const saveSettingsWithSync = async (settingsType: string) => {
    try {
      setIsLoading(true);

      // Validate settings before sending
      if (!settings) {
        toast.error(`Invalid settings data`);
        return;
      }

      const response = await axios.post("/api/store-settings", {
        settings: settings,
      });

      if (response.status === 200 && response.data) {
        setSettings(response.data.settings || response.data);
        await refreshSettings();
        toast.success(`${settingsType} settings saved successfully`);
      } else {
        console.error("Unexpected response:", response);
        toast.error(
          `Failed to save ${settingsType} settings: Invalid response`
        );
      }
    } catch (error: any) {
      console.error(`Error saving ${settingsType} settings:`, error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        `Failed to save ${settingsType} settings`;
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = () => saveSettingsWithSync("Store");
  const saveNewsletterSettings = () => saveSettingsWithSync("Newsletter");
  const saveAboutPageSettings = () => saveSettingsWithSync("About page");
  const saveContactPageSettings = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post("/api/store-settings", {
        settings: {
          ...settings,
          contactPage: {
            ...settings.contactPage,
            contactInfo: settings.contactPage.contactInfo,
          },
        },
      });

      if (response.data) {
        setSettings(response.data);
        await refreshSettings();
        toast.success("Contact page settings saved successfully");
      }
    } catch (error) {
      console.error("Error saving contact page settings:", error);
      toast.error("Failed to save contact page settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddArrayItem = <T extends SectionKey>(
    section: T,
    subsection: SubsectionKey<T>,
    arrayName: string,
    newItem: ArrayItem
  ) =>
    setSettings((prevSettings) => {
      const emptyMultiLangValue: MultiLangValue = { en: "", "zh-TW": "" };

      const toMultiLangValue = (
        value: string | MultiLangValue | undefined
      ): MultiLangValue => {
        if (!value) return emptyMultiLangValue;
        if (typeof value === "string") return { en: value, "zh-TW": value };
        return value;
      };

      let itemToAdd: ArrayItem;

      if ("name" in newItem && "address" in newItem) {
        // Handle office location
        const location = newItem as ContactPageOfficeLocation;
        itemToAdd = {
          name: toMultiLangValue(location.name),
          address: toMultiLangValue(location.address),
          phone: location.phone || "",
          email: location.email || "",
          hours: toMultiLangValue(location.hours),
          coordinates: location.coordinates || { lat: 0, lng: 0 },
        } as ContactPageOfficeLocation;
      } else if ("name" in newItem && "role" in newItem) {
        const member = newItem as AboutPageTeamMember;
        itemToAdd = {
          name: toMultiLangValue(member.name),
          role: toMultiLangValue(member.role),
          image: member.image || "/about1.jpg",
          description: toMultiLangValue(member.description),
        } as AboutPageTeamMember;
      } else if ("question" in newItem && "answer" in newItem) {
        const question = newItem as ContactPageQuestion;
        itemToAdd = {
          question: toMultiLangValue(question.question),
          answer: toMultiLangValue(question.answer),
        } as ContactPageQuestion;
      } else if (
        "title" in newItem &&
        "description" in newItem &&
        !("role" in newItem)
      ) {
        const value = newItem as AboutPageValue;
        itemToAdd = {
          title: toMultiLangValue(value.title),
          description: toMultiLangValue(value.description),
          icon: value.icon || "",
        } as AboutPageValue;
      } else {
        return prevSettings;
      }

      const sectionSettings = prevSettings[section] as SectionType[T];
      const subsectionSettings = sectionSettings[subsection] as Record<
        string,
        ArrayItem[]
      >;
      const currentArray = (subsectionSettings[arrayName] || []) as ArrayItem[];

      const newArray = [...currentArray, itemToAdd];

      return {
        ...prevSettings,
        [section]: {
          ...sectionSettings,
          [subsection]: {
            ...subsectionSettings,
            [arrayName]: newArray,
          },
        },
      };
    });

  const handleRemoveArrayItem = <T extends SectionKey>(
    section: T,
    subsection: SubsectionKey<T>,
    arrayName: string,
    index: number
  ) => {
    setSettings((prevSettings) => {
      const sectionSettings = prevSettings[section] as SectionType[T];
      const subsectionSettings = sectionSettings[subsection] as Record<
        string,
        ArrayItem[]
      >;
      const currentArray = (subsectionSettings[arrayName] || []) as ArrayItem[];

      const newArray = currentArray.filter((_, i) => i !== index);

      return {
        ...prevSettings,
        [section]: {
          ...sectionSettings,
          [subsection]: {
            ...subsectionSettings,
            [arrayName]: newArray,
          },
        },
      };
    });
  };

  const handleCoordinateUpdate = async (
    index: number,
    location: ContactPageOfficeLocation
  ) => {
    if (!window.google) {
      toast.error(
        "Google Maps is not loaded yet. Please refresh the page and try again."
      );
      return;
    }

    try {
      setIsLoading(true);
      const geocoder = new window.google.maps.Geocoder();
      const address = location.address.en;
      console.log("Geocoding address:", address);

      const results = await new Promise<google.maps.GeocoderResult[]>(
        (resolve, reject) => {
          geocoder.geocode({ address: address }, (results, status) => {
            if (status === "OK" && results && results.length > 0) {
              resolve(results);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          });
        }
      );

      if (results[0]?.geometry?.location) {
        const location = results[0].geometry.location;
        const newCoordinates = {
          lat: location.lat(),
          lng: location.lng(),
        };

        // Create a new settings object with updated coordinates
        const updatedSettings = { ...settings };
        const newLocations = [
          ...updatedSettings.contactPage.contactInfo.officeLocations,
        ];
        newLocations[index] = {
          ...newLocations[index],
          coordinates: newCoordinates,
        };
        updatedSettings.contactPage.contactInfo.officeLocations = newLocations;

        // Save to server first
        const response = await axios.post("/api/store-settings", {
          settings: updatedSettings,
        });

        if (response.data) {
          // Only update local state if server save was successful
          setSettings(response.data);
          await refreshSettings();
          toast.success("Location coordinates updated successfully");
        }
      } else {
        throw new Error("No location found for the given address");
      }
    } catch (error) {
      console.error("Error updating coordinates:", error);
      toast.error("Failed to update coordinates");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#535C91] dark:border-[#6B74A9]"></div>
          <span className="animate-pulse">{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  if (!session?.user?.admin) {
    router.push("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#535C91] dark:border-[#6B74A9]"></div>
          <span className="animate-pulse">{t("common.loading")}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
        onLoad={() => setMapsLoaded(true)}
      />
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Breadcrumb items={breadcrumbItems} />
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-[#535C91] to-[#424874] dark:from-[#6B74A9] dark:to-[#535C91] bg-clip-text text-transparent">
              {t("settings.title")}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t("settings.description")}
            </p>
          </div>
        </div>

        <Tabs
          defaultValue="general"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="general">
              {t("settings.tabs.general")}
            </TabsTrigger>
            <TabsTrigger value="newsletter">
              {t("settings.tabs.newsletter")}
            </TabsTrigger>
            <TabsTrigger value="about">{t("settings.tabs.about")}</TabsTrigger>
            <TabsTrigger value="contact">
              {t("settings.tabs.contact")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-gray-200 dark:ring-gray-700">
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    {t("settings.general.storeInfo.title")}
                  </h3>
                  <div className="space-y-4">
                    <div className="mb-4">
                      <MultiLangInput
                        label={t("settings.general.storeInfo.storeName")}
                        value={settings.storeName}
                        onChange={(value: MultiLangValue) =>
                          handleInputChange(value, "storeName")
                        }
                        placeholder={{
                          en: "Enter store name in English",
                          "zh-TW": "輸入商店名稱",
                        }}
                      />
                    </div>
                    <div>
                      <MultiLangInput
                        label={t("settings.general.storeInfo.slogan")}
                        value={settings.slogan}
                        onChange={(value: MultiLangValue) =>
                          handleInputChange(value, "slogan")
                        }
                        placeholder={{
                          en: "Enter store slogan in English",
                          "zh-TW": "輸入商店標語",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.general.storeInfo.storeLogo")}
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                          <Image
                            src={settings.logo}
                            alt={t("settings.general.storeInfo.storeLogo")}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <CldUploadButton
                          className="h-10 px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#535C91] dark:focus:ring-[#6B74A9]"
                          options={{ maxFiles: 1 }}
                          uploadPreset={
                            process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME
                          }
                          onSuccess={handleLogoUpload}
                        >
                          {t("settings.general.storeInfo.changeLogo")}
                        </CldUploadButton>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    {t("settings.general.contactInfo.title")}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.general.contactInfo.email")}
                      </label>
                      <Input
                        name="email"
                        value={settings.contactInfo.email}
                        onChange={(e) => handleInputChange(e, "contactInfo")}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.general.contactInfo.phone")}
                      </label>
                      <Input
                        name="phone"
                        value={settings.contactInfo.phone}
                        onChange={(e) => handleInputChange(e, "contactInfo")}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.general.contactInfo.street")}
                      </label>
                      <MultiLangInput
                        value={settings.contactInfo.address.street}
                        onChange={(value) => {
                          setSettings((prev) => ({
                            ...prev,
                            contactInfo: {
                              ...prev.contactInfo,
                              address: {
                                ...prev.contactInfo.address,
                                street: value,
                              },
                            },
                          }));
                        }}
                        placeholder={{
                          en: "Enter street address in English",
                          "zh-TW": "輸入街道地址",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.general.contactInfo.city")}
                      </label>
                      <MultiLangInput
                        value={settings.contactInfo.address.city}
                        onChange={(value) => {
                          setSettings((prev) => ({
                            ...prev,
                            contactInfo: {
                              ...prev.contactInfo,
                              address: {
                                ...prev.contactInfo.address,
                                city: value,
                              },
                            },
                          }));
                        }}
                        placeholder={{
                          en: "Enter city name in English",
                          "zh-TW": "輸入城市名稱",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.general.contactInfo.postalCode")}
                      </label>
                      <MultiLangInput
                        value={settings.contactInfo.address.postalCode}
                        onChange={(value) => {
                          setSettings((prev) => ({
                            ...prev,
                            contactInfo: {
                              ...prev.contactInfo,
                              address: {
                                ...prev.contactInfo.address,
                                postalCode: value,
                              },
                            },
                          }));
                        }}
                        placeholder={{
                          en: "Enter postal code",
                          "zh-TW": "輸入郵遞區號",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.general.contactInfo.country")}
                      </label>
                      <MultiLangInput
                        value={settings.contactInfo.address.country}
                        onChange={(value) => {
                          setSettings((prev) => ({
                            ...prev,
                            contactInfo: {
                              ...prev.contactInfo,
                              address: {
                                ...prev.contactInfo.address,
                                country: value,
                              },
                            },
                          }));
                        }}
                        placeholder={{
                          en: "Enter country name in English",
                          "zh-TW": "輸入國家名稱",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    {t("settings.general.businessHours.title")}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.general.businessHours.weekdays")}
                      </label>
                      <MultiLangInput
                        value={settings.businessHours.weekdays}
                        onChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            businessHours: {
                              ...prev.businessHours,
                              weekdays: value,
                            },
                          }))
                        }
                        placeholder={{
                          en: "Enter weekday hours (e.g. Mon-Fri: 9am-6pm)",
                          "zh-TW":
                            "輸入平日營業時間（例：週一至週五：上午9點至下午6點）",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.general.businessHours.weekends")}
                      </label>
                      <MultiLangInput
                        value={settings.businessHours.weekends}
                        onChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            businessHours: {
                              ...prev.businessHours,
                              weekends: value,
                            },
                          }))
                        }
                        placeholder={{
                          en: "Enter weekend hours (e.g. Sat-Sun: 10am-4pm)",
                          "zh-TW":
                            "輸入週末營業時間（例：週六至週日：上午10點至下午4點）",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">
                    {t("settings.general.socialMedia.title")}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="facebook"
                        className="block text-sm font-medium mb-1"
                      >
                        {t("settings.general.socialMedia.facebook")}
                      </label>
                      <Input
                        id="facebook"
                        name="socialMedia.facebook"
                        value={settings?.socialMedia?.facebook || ""}
                        onChange={handleInputChange}
                        placeholder="https://facebook.com/your-page"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="instagram"
                        className="block text-sm font-medium mb-1"
                      >
                        {t("settings.general.socialMedia.instagram")}
                      </label>
                      <Input
                        id="instagram"
                        name="socialMedia.instagram"
                        value={settings?.socialMedia?.instagram || ""}
                        onChange={handleInputChange}
                        placeholder="https://instagram.com/your-profile"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="twitter"
                        className="block text-sm font-medium mb-1"
                      >
                        {t("settings.general.socialMedia.twitter")}
                      </label>
                      <Input
                        id="twitter"
                        name="socialMedia.twitter"
                        value={settings?.socialMedia?.twitter || ""}
                        onChange={handleInputChange}
                        placeholder="https://twitter.com/your-handle"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    {t("settings.general.shippingInfo.title")}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.general.shippingInfo.standardDays")}
                      </label>
                      <Input
                        name="standardDays"
                        value={settings.shippingInfo.standardDays}
                        onChange={(e) => handleInputChange(e, "shippingInfo")}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.general.shippingInfo.expressDays")}
                      </label>
                      <Input
                        name="expressDays"
                        value={settings.shippingInfo.expressDays}
                        onChange={(e) => handleInputChange(e, "shippingInfo")}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showShippingInfo"
                        checked={settings.shippingInfo?.show || false}
                        onChange={(e) => {
                          setSettings((prev) => ({
                            ...prev,
                            shippingInfo: {
                              ...prev.shippingInfo,
                              show: e.target.checked,
                            },
                          }));
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label
                        htmlFor="showShippingInfo"
                        className="text-sm font-medium"
                      >
                        {t("settings.general.shippingInfo.showOnContactPage")}
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.general.shippingInfo.sectionTitle")}
                      </label>
                      <MultiLangInput
                        value={
                          settings.shippingInfo?.title || {
                            en: "",
                            "zh-TW": "",
                          }
                        }
                        onChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            shippingInfo: {
                              ...prev.shippingInfo,
                              title: value,
                            },
                          }))
                        }
                        placeholder={{
                          en: t("settings.general.shippingInfo.sectionTitle"),
                          "zh-TW": t(
                            "settings.general.shippingInfo.sectionTitle"
                          ),
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t(
                          "settings.general.shippingInfo.standardShippingTitle"
                        )}
                      </label>
                      <MultiLangInput
                        value={
                          settings.shippingInfo?.standardShipping || {
                            en: "",
                            "zh-TW": "",
                          }
                        }
                        onChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            shippingInfo: {
                              ...prev.shippingInfo,
                              standardShipping: value,
                            },
                          }))
                        }
                        placeholder={{
                          en: t(
                            "settings.general.shippingInfo.standardShippingTitle"
                          ),
                          "zh-TW": t(
                            "settings.general.shippingInfo.standardShippingTitle"
                          ),
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t(
                          "settings.general.shippingInfo.expressShippingTitle"
                        )}
                      </label>
                      <MultiLangInput
                        value={
                          settings.shippingInfo?.expressShipping || {
                            en: "",
                            "zh-TW": "",
                          }
                        }
                        onChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            shippingInfo: {
                              ...prev.shippingInfo,
                              expressShipping: value,
                            },
                          }))
                        }
                        placeholder={{
                          en: t(
                            "settings.general.shippingInfo.expressShippingTitle"
                          ),
                          "zh-TW": t(
                            "settings.general.shippingInfo.expressShippingTitle"
                          ),
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    {t("settings.general.returnPolicy.title")}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.general.returnPolicy.daysToReturn")}
                      </label>
                      <Input
                        type="number"
                        name="daysToReturn"
                        value={settings.returnPolicy.daysToReturn}
                        onChange={(e) => handleInputChange(e, "returnPolicy")}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.general.returnPolicy.conditions")}
                      </label>
                      <MultiLangInput
                        value={settings.returnPolicy.conditions}
                        onChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            returnPolicy: {
                              ...prev.returnPolicy,
                              conditions: value,
                            },
                          }))
                        }
                        placeholder={{
                          en: "Enter return policy conditions in English",
                          "zh-TW": "輸入退貨政策條件",
                        }}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showReturnPolicy"
                        checked={settings.returnPolicy?.show || false}
                        onChange={(e) => {
                          setSettings((prev) => ({
                            ...prev,
                            returnPolicy: {
                              ...prev.returnPolicy,
                              show: e.target.checked,
                            },
                          }));
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label
                        htmlFor="showReturnPolicy"
                        className="text-sm font-medium"
                      >
                        {t("settings.general.returnPolicy.showOnContactPage")}
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.general.returnPolicy.sectionTitle")}
                      </label>
                      <MultiLangInput
                        value={
                          settings.returnPolicy?.title || {
                            en: "",
                            "zh-TW": "",
                          }
                        }
                        onChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            returnPolicy: {
                              ...prev.returnPolicy,
                              title: value,
                            },
                          }))
                        }
                        placeholder={{
                          en: "Enter return policy section title in English",
                          "zh-TW": "輸入退貨政策標題",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <MultiLangInput
                    label={t("settings.general.storeInfo.copyright")}
                    value={settings.copyright}
                    onChange={(value: MultiLangValue) =>
                      handleInputChange(value, "copyright")
                    }
                    placeholder={{
                      en: "Enter copyright text in English (e.g. © 2024 Your Store. All rights reserved.)",
                      "zh-TW":
                        "輸入版權文字（例：© 2024 您的商店。保留所有權利。）",
                    }}
                  />
                </div>

                <Button
                  onClick={saveSettings}
                  className="w-full md:w-auto bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91] text-white"
                  disabled={isLoading}
                >
                  {isLoading
                    ? t("settings.buttons.saving")
                    : t("settings.buttons.saveChanges")}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="newsletter">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-gray-200 dark:ring-gray-700">
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {t("settings.newsletter.title")}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white dark:text-white">
                        {t("settings.newsletter.title")}
                      </label>
                      <MultiLangInput
                        value={settings.newsletterSettings.title}
                        onChange={(value) => {
                          setSettings((prev) => ({
                            ...prev,
                            newsletterSettings: {
                              ...prev.newsletterSettings,
                              title: value,
                            },
                          }));
                        }}
                        placeholder={{
                          en: "Enter newsletter title in English (e.g. Subscribe to Our Newsletter)",
                          "zh-TW": "輸入電子報標題（例：訂閱我們的電子報）",
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white dark:text-white">
                        {t("settings.newsletter.subtitle")}
                      </label>
                      <MultiLangInput
                        value={settings.newsletterSettings.subtitle}
                        onChange={(value) => {
                          setSettings((prev) => ({
                            ...prev,
                            newsletterSettings: {
                              ...prev.newsletterSettings,
                              subtitle: value,
                            },
                          }));
                        }}
                        placeholder={{
                          en: "Enter newsletter subtitle in English (e.g. Get 15% off your first order!)",
                          "zh-TW":
                            "輸入電子報副標題（例：首次訂單可享85折優惠！）",
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-4">
                        {t("settings.newsletter.bannerImage")}
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="relative w-40 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                          <Image
                            src={
                              settings.newsletterSettings?.bannerImage ||
                              "/newsletter.jpg"
                            }
                            alt={t("settings.newsletter.bannerImage")}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <CldUploadButton
                          className="h-10 px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91]"
                          options={{ maxFiles: 1 }}
                          uploadPreset={
                            process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME
                          }
                          onSuccess={handleNewsletterBannerUpload}
                        >
                          {t("settings.newsletter.changeBanner")}
                        </CldUploadButton>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.newsletter.discountPercentage")}
                      </label>
                      <Input
                        type="number"
                        name="discountPercentage"
                        value={
                          settings.newsletterSettings?.discountPercentage || ""
                        }
                        onChange={(e) =>
                          handleInputChange(e, "newsletterSettings")
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white dark:text-white">
                        {t("settings.newsletter.buttonText")}
                      </label>
                      <MultiLangInput
                        value={settings.newsletterSettings.buttonText}
                        onChange={(value) => {
                          setSettings((prev) => ({
                            ...prev,
                            newsletterSettings: {
                              ...prev.newsletterSettings,
                              buttonText: value,
                            },
                          }));
                        }}
                        placeholder={{
                          en: t("newsletter.buttonText"),
                          "zh-TW": t("newsletter.buttonText", { lng: "zh-TW" }),
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white dark:text-white">
                        {t("settings.newsletter.disclaimer")}
                      </label>
                      <MultiLangInput
                        value={settings.newsletterSettings.disclaimer}
                        onChange={(value) => {
                          setSettings((prev) => ({
                            ...prev,
                            newsletterSettings: {
                              ...prev.newsletterSettings,
                              disclaimer: value,
                            },
                          }));
                        }}
                        placeholder={{
                          en: t("newsletter.disclaimer"),
                          "zh-TW": t("newsletter.disclaimer", { lng: "zh-TW" }),
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button
                      onClick={saveNewsletterSettings}
                      className="w-full md:w-auto bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91] text-white"
                      disabled={isLoading}
                    >
                      {isLoading
                        ? t("settings.buttons.saving")
                        : t("settings.buttons.saveChanges")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="about">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-gray-200 dark:ring-gray-700">
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    {t("settings.about.aboutPageSection.title")}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.about.aboutPageSection.title")}
                      </label>
                      <MultiLangInput
                        value={settings.aboutPage.title}
                        onChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            aboutPage: { ...prev.aboutPage, title: value },
                          }))
                        }
                        placeholder={{
                          en: t("settings.about.aboutPageSection.title"),
                          "zh-TW": t("settings.about.aboutPageSection.title"),
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.about.aboutPageSection.subtitle")}
                      </label>
                      <MultiLangInput
                        value={settings.aboutPage.subtitle}
                        onChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            aboutPage: { ...prev.aboutPage, subtitle: value },
                          }))
                        }
                        placeholder={{
                          en: t("settings.about.aboutPageSection.subtitle"),
                          "zh-TW": t(
                            "settings.about.aboutPageSection.subtitle"
                          ),
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.about.aboutPageSection.bannerImage")}
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="relative w-40 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                          <Image
                            src={settings.aboutPage.bannerImage}
                            alt="About Banner"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <CldUploadButton
                          className="h-10 px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91]"
                          options={{ maxFiles: 1 }}
                          uploadPreset={
                            process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME
                          }
                          onSuccess={handleAboutBannerUpload}
                        >
                          {t("settings.about.aboutPageSection.changeBanner")}
                        </CldUploadButton>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    {t("settings.about.storySection.title")}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.about.storySection.title")}
                      </label>
                      <MultiLangInput
                        value={settings.aboutPage.story.title}
                        onChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            aboutPage: {
                              ...prev.aboutPage,
                              story: { ...prev.aboutPage.story, title: value },
                            },
                          }))
                        }
                        placeholder={{
                          en: t("settings.about.storySection.title"),
                          "zh-TW": t("settings.about.storySection.title"),
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.about.storySection.content")}
                      </label>
                      <MultiLangInput
                        type="textarea"
                        value={settings.aboutPage.story.content}
                        onChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            aboutPage: {
                              ...prev.aboutPage,
                              story: {
                                ...prev.aboutPage.story,
                                content: value,
                              },
                            },
                          }))
                        }
                        placeholder={{
                          en: t("settings.about.storySection.content"),
                          "zh-TW": t("settings.about.storySection.content"),
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.about.storySection.storyImage")}
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="relative w-40 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                          <Image
                            src={settings.aboutPage.story.image}
                            alt="Story Image"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <CldUploadButton
                          className="h-10 px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91]"
                          options={{ maxFiles: 1 }}
                          uploadPreset={
                            process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME
                          }
                          onSuccess={handleStoryImageUpload}
                        >
                          {t("settings.about.storySection.changeImage")}
                        </CldUploadButton>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    {t("settings.about.valuesSection.title")}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.about.valuesSection.title")}
                      </label>
                      <MultiLangInput
                        value={settings.aboutPage.values.title}
                        onChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            aboutPage: {
                              ...prev.aboutPage,
                              values: {
                                ...prev.aboutPage.values,
                                title: value,
                              },
                            },
                          }))
                        }
                        placeholder={{
                          en: t("settings.about.valuesSection.title"),
                          "zh-TW": t("settings.about.valuesSection.title", {
                            lng: "zh-TW",
                          }),
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.about.valuesSection.values")}
                      </label>
                      {settings.aboutPage.values.items.map((value, index) => (
                        <div key={index} className="flex gap-4 mb-4">
                          <div className="flex-1 space-y-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                {t("settings.about.valuesSection.title")}
                              </label>
                              <MultiLangInput
                                value={value.title}
                                onChange={(newValue) => {
                                  const newItems = [
                                    ...settings.aboutPage.values.items,
                                  ];
                                  newItems[index] = {
                                    ...newItems[index],
                                    title: newValue,
                                  };
                                  setSettings((prev) => ({
                                    ...prev,
                                    aboutPage: {
                                      ...prev.aboutPage,
                                      values: {
                                        ...prev.aboutPage.values,
                                        items: newItems,
                                      },
                                    },
                                  }));
                                }}
                                placeholder={{
                                  en: t("settings.about.valuesSection.title"),
                                  "zh-TW": t(
                                    "settings.about.valuesSection.title",
                                    { lng: "zh-TW" }
                                  ),
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                {t("settings.about.valuesSection.description")}
                              </label>
                              <MultiLangInput
                                type="textarea"
                                value={value.description}
                                onChange={(newValue) => {
                                  const newItems = [
                                    ...settings.aboutPage.values.items,
                                  ];
                                  newItems[index] = {
                                    ...newItems[index],
                                    description: newValue,
                                  };
                                  setSettings((prev) => ({
                                    ...prev,
                                    aboutPage: {
                                      ...prev.aboutPage,
                                      values: {
                                        ...prev.aboutPage.values,
                                        items: newItems,
                                      },
                                    },
                                  }));
                                }}
                                placeholder={{
                                  en: t(
                                    "settings.about.valuesSection.description"
                                  ),
                                  "zh-TW": t(
                                    "settings.about.valuesSection.description",
                                    { lng: "zh-TW" }
                                  ),
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                {t("settings.about.valuesSection.iconName")}
                              </label>
                              <Input
                                value={value.icon}
                                onChange={(e) => {
                                  const newItems = [
                                    ...settings.aboutPage.values.items,
                                  ];
                                  newItems[index] = {
                                    ...newItems[index],
                                    icon: e.target.value,
                                  };
                                  setSettings((prev) => ({
                                    ...prev,
                                    aboutPage: {
                                      ...prev.aboutPage,
                                      values: {
                                        ...prev.aboutPage.values,
                                        items: newItems,
                                      },
                                    },
                                  }));
                                }}
                                placeholder={t(
                                  "settings.about.valuesSection.iconName"
                                )}
                              />
                            </div>
                          </div>
                          <Button
                            onClick={() =>
                              handleRemoveArrayItem(
                                "aboutPage",
                                "values",
                                "items",
                                index
                              )
                            }
                            variant="destructive"
                            size="icon"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        onClick={() =>
                          handleAddArrayItem("aboutPage", "values", "items", {
                            title: {
                              en: "",
                              "zh-TW": "",
                            },
                            description: {
                              en: "",
                              "zh-TW": "",
                            },
                            icon: "",
                          })
                        }
                        variant="outline"
                        className="mt-2"
                      >
                        {t("settings.about.valuesSection.addValue")}
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    {t("settings.about.teamSection.title")}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.about.teamSection.title")}
                      </label>
                      <MultiLangInput
                        value={settings.aboutPage.team.title}
                        onChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            aboutPage: {
                              ...prev.aboutPage,
                              team: {
                                ...prev.aboutPage.team,
                                title: value,
                              },
                            },
                          }))
                        }
                        placeholder={{
                          en: t("settings.about.teamSection.title"),
                          "zh-TW": t("settings.about.teamSection.title", {
                            lng: "zh-TW",
                          }),
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.about.teamSection.teamMembers")}
                      </label>
                      {settings.aboutPage.team.members.map((member, index) => (
                        <div key={index} className="flex gap-4 mb-4">
                          <div className="flex-1 space-y-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                {t("settings.about.teamSection.name")}
                              </label>
                              <MultiLangInput
                                value={member.name}
                                onChange={(value) => {
                                  const newMembers = [
                                    ...settings.aboutPage.team.members,
                                  ];
                                  newMembers[index] = {
                                    ...newMembers[index],
                                    name: value,
                                  };
                                  setSettings((prev) => ({
                                    ...prev,
                                    aboutPage: {
                                      ...prev.aboutPage,
                                      team: {
                                        ...prev.aboutPage.team,
                                        members: newMembers,
                                      },
                                    },
                                  }));
                                }}
                                placeholder={{
                                  en: t("settings.about.teamSection.name"),
                                  "zh-TW": t(
                                    "settings.about.teamSection.name",
                                    { lng: "zh-TW" }
                                  ),
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                {t("settings.about.teamSection.role")}
                              </label>
                              <MultiLangInput
                                value={member.role}
                                onChange={(value) => {
                                  const newMembers = [
                                    ...settings.aboutPage.team.members,
                                  ];
                                  newMembers[index] = {
                                    ...newMembers[index],
                                    role: value,
                                  };
                                  setSettings((prev) => ({
                                    ...prev,
                                    aboutPage: {
                                      ...prev.aboutPage,
                                      team: {
                                        ...prev.aboutPage.team,
                                        members: newMembers,
                                      },
                                    },
                                  }));
                                }}
                                placeholder={{
                                  en: t("settings.about.teamSection.role"),
                                  "zh-TW": t(
                                    "settings.about.teamSection.role",
                                    { lng: "zh-TW" }
                                  ),
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                {t("settings.about.teamSection.description")}
                              </label>
                              <MultiLangInput
                                value={member.description}
                                onChange={(value) => {
                                  const newMembers = [
                                    ...settings.aboutPage.team.members,
                                  ];
                                  newMembers[index] = {
                                    ...newMembers[index],
                                    description: value,
                                  };
                                  setSettings((prev) => ({
                                    ...prev,
                                    aboutPage: {
                                      ...prev.aboutPage,
                                      team: {
                                        ...prev.aboutPage.team,
                                        members: newMembers,
                                      },
                                    },
                                  }));
                                }}
                                placeholder={{
                                  en: t(
                                    "settings.about.teamSection.description"
                                  ),
                                  "zh-TW": t(
                                    "settings.about.teamSection.description",
                                    { lng: "zh-TW" }
                                  ),
                                }}
                              />
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                <Image
                                  src={member.image}
                                  alt={
                                    typeof member.name === "string"
                                      ? member.name
                                      : member.name.en
                                  }
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex gap-2">
                                <CldUploadButton
                                  className="h-9 px-3 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91]"
                                  options={{ maxFiles: 1 }}
                                  uploadPreset={
                                    process.env
                                      .NEXT_PUBLIC_CLOUDINARY_PRESET_NAME
                                  }
                                  onSuccess={(result) =>
                                    handleTeamMemberImageUpload(result, index)
                                  }
                                >
                                  {t("settings.about.teamSection.change")}
                                </CldUploadButton>
                                <Button
                                  onClick={() =>
                                    handleRemoveArrayItem(
                                      "aboutPage",
                                      "team",
                                      "members",
                                      index
                                    )
                                  }
                                  variant="destructive"
                                  size="sm"
                                  className="h-9 px-3"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button
                        onClick={() => {
                          handleAddArrayItem("aboutPage", "team", "members", {
                            name: { en: "", "zh-TW": "" },
                            role: { en: "", "zh-TW": "" },
                            image: "",
                            description: { en: "", "zh-TW": "" },
                          });
                        }}
                        variant="outline"
                        className="mt-2"
                      >
                        {t("settings.about.teamSection.addTeamMember")}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    onClick={saveAboutPageSettings}
                    className="w-full md:w-auto bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91] text-white"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? t("settings.buttons.saving")
                      : t("settings.buttons.saveChanges")}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contact">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-gray-200 dark:ring-gray-700">
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    {t("settings.contact.contactPageSection.title")}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.contact.contactPageSection.title")}
                      </label>
                      <MultiLangInput
                        value={settings.contactPage.title}
                        onChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            contactPage: { ...prev.contactPage, title: value },
                          }))
                        }
                        placeholder={{
                          en: "Enter contact page title in English (e.g. Contact Us)",
                          "zh-TW": "輸入聯絡頁面標題（例：聯絡我們）",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.contact.contactPageSection.subtitle")}
                      </label>
                      <MultiLangInput
                        value={settings.contactPage.subtitle}
                        onChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            contactPage: {
                              ...prev.contactPage,
                              subtitle: value,
                            },
                          }))
                        }
                        placeholder={{
                          en: "Enter contact page subtitle in English (e.g. Get in Touch with Us)",
                          "zh-TW": "輸入聯絡頁面副標題（例：與我們聯繫）",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.contact.contactPageSection.bannerImage")}
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="relative w-40 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                          <Image
                            src={settings.contactPage.bannerImage}
                            alt="Contact Banner"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <CldUploadButton
                          className="h-10 px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91]"
                          options={{ maxFiles: 1 }}
                          uploadPreset={
                            process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME
                          }
                          onSuccess={handleContactBannerUpload}
                        >
                          {t(
                            "settings.contact.contactPageSection.changeBanner"
                          )}
                        </CldUploadButton>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    {t("settings.contact.contactInfo.title")}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.contact.contactInfo.title")}
                      </label>
                      <MultiLangInput
                        value={settings.contactPage.contactInfo.title}
                        onChange={(value) => {
                          setSettings((prev) => ({
                            ...prev,
                            contactPage: {
                              ...prev.contactPage,
                              contactInfo: {
                                ...prev.contactPage.contactInfo,
                                title: value,
                              },
                            },
                          }));
                        }}
                        placeholder={{
                          en: "Enter contact info section title in English (e.g. Our Locations)",
                          "zh-TW": "輸入聯絡資訊區段標題（例：我們的據點）",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.contact.contactInfo.officeLocations")}
                      </label>
                      {settings.contactPage.contactInfo.officeLocations.map(
                        (location, index) => (
                          <div
                            key={index}
                            className="group relative mb-6 bg-card/50 rounded-lg p-6 border border-border"
                          >
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium mb-1">
                                  {t(
                                    "settings.contact.contactInfo.locationName"
                                  )}
                                </label>
                                <MultiLangInput
                                  value={location.name}
                                  onChange={(value) => {
                                    const newLocations = [
                                      ...settings.contactPage.contactInfo
                                        .officeLocations,
                                    ];
                                    newLocations[index] = {
                                      ...newLocations[index],
                                      name: value,
                                    };
                                    setSettings((prev) => ({
                                      ...prev,
                                      contactPage: {
                                        ...prev.contactPage,
                                        contactInfo: {
                                          ...prev.contactPage.contactInfo,
                                          officeLocations: newLocations,
                                        },
                                      },
                                    }));
                                  }}
                                  placeholder={{
                                    en: "Enter location name in English (e.g. Downtown Store)",
                                    "zh-TW": "輸入據點名稱（例：市中心店）",
                                  }}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">
                                  {t("settings.contact.contactInfo.address")}
                                </label>
                                <MultiLangInput
                                  value={location.address}
                                  onChange={(value) => {
                                    const newLocations = [
                                      ...settings.contactPage.contactInfo
                                        .officeLocations,
                                    ];
                                    newLocations[index] = {
                                      ...newLocations[index],
                                      address: value,
                                    };
                                    setSettings((prev) => ({
                                      ...prev,
                                      contactPage: {
                                        ...prev.contactPage,
                                        contactInfo: {
                                          ...prev.contactPage.contactInfo,
                                          officeLocations: newLocations,
                                        },
                                      },
                                    }));
                                  }}
                                  placeholder={{
                                    en: "Enter full address in English",
                                    "zh-TW": "輸入完整地址",
                                  }}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">
                                  {t(
                                    "settings.contact.contactInfo.phoneNumber"
                                  )}
                                </label>
                                <Input
                                  name={`contactInfo.officeLocations.${index}.phone`}
                                  value={location.phone}
                                  onChange={(e) =>
                                    handleInputChange(e, "contactPage")
                                  }
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">
                                  {t(
                                    "settings.contact.contactInfo.emailAddress"
                                  )}
                                </label>
                                <Input
                                  name={`contactInfo.officeLocations.${index}.email`}
                                  value={location.email}
                                  onChange={(e) =>
                                    handleInputChange(e, "contactPage")
                                  }
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium mb-1">
                                    {t("settings.contact.contactInfo.latitude")}
                                  </label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="number"
                                      step="0.0001"
                                      name={`contactInfo.officeLocations.${index}.coordinates.lat`}
                                      value={location.coordinates?.lat || ""}
                                      onChange={(e) => {
                                        const newValue = parseFloat(
                                          e.target.value
                                        );
                                        setSettings((prev) => {
                                          const newSettings = { ...prev };
                                          const newLocations = [
                                            ...prev.contactPage.contactInfo
                                              .officeLocations,
                                          ];
                                          if (
                                            !newLocations[index].coordinates
                                          ) {
                                            newLocations[index].coordinates = {
                                              lat: 0,
                                              lng: 0,
                                            };
                                          }
                                          newLocations[index].coordinates.lat =
                                            newValue || 0;
                                          newSettings.contactPage.contactInfo.officeLocations =
                                            newLocations;
                                          return newSettings;
                                        });
                                      }}
                                      placeholder={t(
                                        "settings.contact.contactInfo.latitude"
                                      )}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">
                                    {t(
                                      "settings.contact.contactInfo.longitude"
                                    )}
                                  </label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="number"
                                      step="0.0001"
                                      name={`contactInfo.officeLocations.${index}.coordinates.lng`}
                                      value={location.coordinates?.lng || ""}
                                      onChange={(e) => {
                                        const newValue = parseFloat(
                                          e.target.value
                                        );
                                        setSettings((prev) => {
                                          const newSettings = { ...prev };
                                          const newLocations = [
                                            ...prev.contactPage.contactInfo
                                              .officeLocations,
                                          ];
                                          if (
                                            !newLocations[index].coordinates
                                          ) {
                                            newLocations[index].coordinates = {
                                              lat: 0,
                                              lng: 0,
                                            };
                                          }
                                          newLocations[index].coordinates.lng =
                                            newValue || 0;
                                          newSettings.contactPage.contactInfo.officeLocations =
                                            newLocations;
                                          return newSettings;
                                        });
                                      }}
                                      placeholder={t(
                                        "settings.contact.contactInfo.longitude"
                                      )}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-4 mt-2">
                                <Button
                                  onClick={() =>
                                    handleCoordinateUpdate(index, location)
                                  }
                                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                                  disabled={!mapsLoaded || !location.address}
                                >
                                  {t(
                                    "settings.contact.contactInfo.getCoordinates"
                                  )}
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleRemoveArrayItem(
                                      "contactPage",
                                      "contactInfo",
                                      "officeLocations",
                                      index
                                    )
                                  }
                                  variant="destructive"
                                  className="flex items-center gap-1 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t("settings.contact.contactInfo.delete")}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                      <Button
                        onClick={() =>
                          handleAddArrayItem(
                            "contactPage",
                            "contactInfo",
                            "officeLocations",
                            {
                              name: { en: "", "zh-TW": "" },
                              address: { en: "", "zh-TW": "" },
                              phone: "",
                              email: "",
                              hours: { en: "", "zh-TW": "" },
                              coordinates: { lat: 0, lng: 0 },
                            }
                          )
                        }
                        variant="outline"
                        className="mt-2"
                      >
                        {t("settings.contact.contactInfo.addOfficeLocation")}
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    {t("settings.contact.supportChannels.title")}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.contact.supportChannels.title")}
                      </label>
                      <MultiLangInput
                        value={settings.contactPage.supportChannels.title}
                        onChange={(value) => {
                          setSettings((prev) => ({
                            ...prev,
                            contactPage: {
                              ...prev.contactPage,
                              supportChannels: {
                                ...prev.contactPage.supportChannels,
                                title: value,
                              },
                            },
                          }));
                        }}
                        placeholder={{
                          en: t("settings.contact.supportChannels.title"),
                          "zh-TW": t("settings.contact.supportChannels.title"),
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t(
                          "settings.contact.supportChannels.supportChannelsImage"
                        )}
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="relative w-40 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                          <Image
                            src={settings.contactPage.supportChannels.image}
                            alt="Support Channels"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <CldUploadButton
                          className="h-10 px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91]"
                          options={{ maxFiles: 1 }}
                          uploadPreset={
                            process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME
                          }
                          onSuccess={handleSupportChannelsImageUpload}
                        >
                          {t("settings.contact.supportChannels.changeImage")}
                        </CldUploadButton>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.contact.supportChannels.channels")}
                      </label>
                      {settings.contactPage.supportChannels.channels.map(
                        (channel, index) => (
                          <div key={index} className="flex gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                {t("settings.contact.supportChannels.title")}
                              </label>
                              <MultiLangInput
                                value={channel.title}
                                onChange={(value) => {
                                  const newChannels = [
                                    ...settings.contactPage.supportChannels
                                      .channels,
                                  ];
                                  newChannels[index] = {
                                    ...newChannels[index],
                                    title: value,
                                  };
                                  setSettings((prev) => ({
                                    ...prev,
                                    contactPage: {
                                      ...prev.contactPage,
                                      supportChannels: {
                                        ...prev.contactPage.supportChannels,
                                        channels: newChannels,
                                      },
                                    },
                                  }));
                                }}
                                placeholder={{
                                  en: t(
                                    "settings.contact.supportChannels.title"
                                  ),
                                  "zh-TW": t(
                                    "settings.contact.supportChannels.title"
                                  ),
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                {t(
                                  "settings.contact.supportChannels.description"
                                )}
                              </label>
                              <MultiLangInput
                                value={channel.description}
                                onChange={(value) => {
                                  const newChannels = [
                                    ...settings.contactPage.supportChannels
                                      .channels,
                                  ];
                                  newChannels[index] = {
                                    ...newChannels[index],
                                    description: value,
                                  };
                                  setSettings((prev) => ({
                                    ...prev,
                                    contactPage: {
                                      ...prev.contactPage,
                                      supportChannels: {
                                        ...prev.contactPage.supportChannels,
                                        channels: newChannels,
                                      },
                                    },
                                  }));
                                }}
                                placeholder={{
                                  en: t(
                                    "settings.contact.supportChannels.description"
                                  ),
                                  "zh-TW": t(
                                    "settings.contact.supportChannels.description"
                                  ),
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                {t("settings.contact.supportChannels.iconName")}
                              </label>
                              <Input
                                value={channel.icon}
                                onChange={(e) => {
                                  const newChannels = [
                                    ...settings.contactPage.supportChannels
                                      .channels,
                                  ];
                                  newChannels[index] = {
                                    ...newChannels[index],
                                    icon: e.target.value,
                                  };
                                  setSettings((prev) => ({
                                    ...prev,
                                    contactPage: {
                                      ...prev.contactPage,
                                      supportChannels: {
                                        ...prev.contactPage.supportChannels,
                                        channels: newChannels,
                                      },
                                    },
                                  }));
                                }}
                                placeholder={t(
                                  "settings.contact.supportChannels.iconName"
                                )}
                              />
                            </div>
                            <Button
                              onClick={() =>
                                handleRemoveArrayItem(
                                  "contactPage",
                                  "supportChannels",
                                  "channels",
                                  index
                                )
                              }
                              variant="destructive"
                              size="icon"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      )}
                      <Button
                        onClick={() =>
                          handleAddArrayItem(
                            "contactPage",
                            "supportChannels",
                            "channels",
                            {
                              title: { en: "", "zh-TW": "" },
                              description: { en: "", "zh-TW": "" },
                              icon: "",
                            }
                          )
                        }
                        variant="outline"
                        className="mt-2"
                      >
                        {t("settings.contact.supportChannels.addChannel")}
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    {t("settings.contact.faqSection.title")}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.contact.faqSection.title")}
                      </label>
                      <MultiLangInput
                        value={settings.contactPage.faq.title}
                        onChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            contactPage: {
                              ...prev.contactPage,
                              faq: { ...prev.contactPage.faq, title: value },
                            },
                          }))
                        }
                        placeholder={{
                          en: t("settings.contact.faqSection.title"),
                          "zh-TW": t("settings.contact.faqSection.title"),
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("settings.contact.faqSection.questions")}
                      </label>
                      {settings.contactPage.faq.questions.map((faq, index) => (
                        <div key={index} className="flex gap-4 mb-4">
                          <MultiLangInput
                            value={faq.question}
                            onChange={(value) => {
                              const newQuestions = [
                                ...settings.contactPage.faq.questions,
                              ];
                              newQuestions[index] = {
                                ...newQuestions[index],
                                question: value,
                              };
                              setSettings((prev) => ({
                                ...prev,
                                contactPage: {
                                  ...prev.contactPage,
                                  faq: {
                                    ...prev.contactPage.faq,
                                    questions: newQuestions,
                                  },
                                },
                              }));
                            }}
                            placeholder={{
                              en: t("settings.contact.faqSection.question"),
                              "zh-TW": t(
                                "settings.contact.faqSection.question"
                              ),
                            }}
                          />
                          <MultiLangInput
                            value={faq.answer}
                            onChange={(value) => {
                              const newQuestions = [
                                ...settings.contactPage.faq.questions,
                              ];
                              newQuestions[index] = {
                                ...newQuestions[index],
                                answer: value,
                              };
                              setSettings((prev) => ({
                                ...prev,
                                contactPage: {
                                  ...prev.contactPage,
                                  faq: {
                                    ...prev.contactPage.faq,
                                    questions: newQuestions,
                                  },
                                },
                              }));
                            }}
                            placeholder={{
                              en: t("settings.contact.faqSection.answer"),
                              "zh-TW": t("settings.contact.faqSection.answer"),
                            }}
                          />
                          <Button
                            onClick={() =>
                              handleRemoveArrayItem(
                                "contactPage",
                                "faq",
                                "questions",
                                index
                              )
                            }
                            variant="destructive"
                            size="icon"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        onClick={() =>
                          handleAddArrayItem(
                            "contactPage",
                            "faq",
                            "questions",
                            {
                              question: { en: "", "zh-TW": "" },
                              answer: { en: "", "zh-TW": "" },
                            }
                          )
                        }
                        variant="outline"
                        className="mt-2"
                      >
                        {t("settings.contact.faqSection.addFAQ")}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    onClick={saveContactPageSettings}
                    className="w-full md:w-auto bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91] text-white"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? t("settings.buttons.saving")
                      : t("settings.buttons.saveChanges")}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

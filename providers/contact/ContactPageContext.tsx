"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useStore } from "@/providers/store/StoreContext";

// Types for Contact Page data structure
interface MultiLangValue {
  en: string;
  "zh-TW": string;
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

export interface ContactPage {
  title: MultiLangValue;
  subtitle: MultiLangValue;
  bannerImage: string;
  contactInfo: ContactPageInfo;
  supportChannels: ContactPageChannels;
  faq: ContactPageFAQ;
  shippingInfo?: {
    show: boolean;
    title: MultiLangValue;
    standardShipping: MultiLangValue;
    expressShipping: MultiLangValue;
    standardDays: string;
    expressDays: string;
  };
  returnPolicy?: {
    show: boolean;
    title: MultiLangValue;
    conditions: MultiLangValue;
    daysToReturn: number;
  };
}

interface StoreSettings {
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
}

interface ContactPageContextType {
  contactSettings: ContactPage | null;
  isLoading: boolean;
  error: string | null;
  updateContactSettings: (newSettings: Partial<ContactPage>) => Promise<void>;
  updateBannerImage: (imageUrl: string) => Promise<void>;
  updateSupportChannelImage: (imageUrl: string) => Promise<void>;
  addOfficeLocation: (location: ContactPageOfficeLocation) => Promise<void>;
  removeOfficeLocation: (index: number) => Promise<void>;
  addSupportChannel: (channel: ContactPageChannel) => Promise<void>;
  removeSupportChannel: (index: number) => Promise<void>;
  addFAQQuestion: (question: ContactPageQuestion) => Promise<void>;
  removeFAQQuestion: (index: number) => Promise<void>;
}

const defaultContext: ContactPageContextType = {
  contactSettings: null,
  isLoading: false,
  error: null,
  updateContactSettings: async () => {},
  updateBannerImage: async () => {},
  updateSupportChannelImage: async () => {},
  addOfficeLocation: async () => {},
  removeOfficeLocation: async () => {},
  addSupportChannel: async () => {},
  removeSupportChannel: async () => {},
  addFAQQuestion: async () => {},
  removeFAQQuestion: async () => {},
};

export const ContactPageContext =
  createContext<ContactPageContextType>(defaultContext);

export const useContactPage = () => {
  const context = useContext(ContactPageContext);
  if (!context) {
    throw new Error("useContactPage must be used within a ContactPageProvider");
  }
  return context;
};

export const ContactPageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { settings, refreshSettings } = useStore();
  const [contactSettings, setContactSettings] = useState<ContactPage | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setContactSettings({
        ...settings.contactPage,
        shippingInfo: {
          show: settings.shippingInfo?.show || false,
          title: settings.shippingInfo?.title || { en: "", "zh-TW": "" },
          standardShipping: settings.shippingInfo?.standardShipping || {
            en: "",
            "zh-TW": "",
          },
          expressShipping: settings.shippingInfo?.expressShipping || {
            en: "",
            "zh-TW": "",
          },
          standardDays: settings.shippingInfo?.standardDays || "",
          expressDays: settings.shippingInfo?.expressDays || "",
        },
        returnPolicy: {
          show: settings.returnPolicy?.show || false,
          title: settings.returnPolicy?.title || { en: "", "zh-TW": "" },
          conditions: settings.returnPolicy?.conditions || {
            en: "",
            "zh-TW": "",
          },
          daysToReturn: settings.returnPolicy?.daysToReturn || 0,
        },
      } as ContactPage);
    }
  }, [settings]);

  const updateContactSettings = async (newSettings: Partial<ContactPage>) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Updating contact settings:", newSettings);

      // Update local state immediately for better UX
      const updatedSettings = { ...contactSettings, ...newSettings };
      setContactSettings(updatedSettings as ContactPage);

      // Update the settings in the database
      const response = await axios.post("/api/store-settings", {
        settings: {
          contactPage: {
            ...updatedSettings,
            shippingInfo: undefined, // Remove from contactPage since it's stored at root level
            returnPolicy: undefined, // Remove from contactPage since it's stored at root level
          },
          // Update shipping and return policy at root level
          shippingInfo: updatedSettings.shippingInfo,
          returnPolicy: updatedSettings.returnPolicy,
        },
      });

      console.log("Server response:", response.data);

      if (response.data?.settings) {
        // Update local state with the response, combining contactPage with shipping/return info
        setContactSettings({
          ...response.data.settings.contactPage,
          shippingInfo: response.data.settings.shippingInfo,
          returnPolicy: response.data.settings.returnPolicy,
        } as ContactPage);

        // Refresh the store settings to ensure consistency
        await refreshSettings();
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Failed to update contact page settings:", err);
      setError("Failed to update contact page settings");
      // Revert local state on error
      if (settings?.contactPage) {
        setContactSettings({
          ...settings.contactPage,
          shippingInfo: settings.shippingInfo,
          returnPolicy: settings.returnPolicy,
        } as ContactPage);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateBannerImage = async (imageUrl: string) => {
    await updateContactSettings({ bannerImage: imageUrl });
  };

  const updateSupportChannelImage = async (imageUrl: string) => {
    if (!contactSettings) return;
    await updateContactSettings({
      supportChannels: {
        ...contactSettings.supportChannels,
        image: imageUrl,
      },
    });
  };

  const addOfficeLocation = async (location: ContactPageOfficeLocation) => {
    if (!contactSettings) return;
    const newLocations = [
      ...contactSettings.contactInfo.officeLocations,
      location,
    ];
    await updateContactSettings({
      contactInfo: {
        ...contactSettings.contactInfo,
        officeLocations: newLocations,
      },
    });
  };

  const removeOfficeLocation = async (index: number) => {
    if (!contactSettings) return;
    const newLocations = contactSettings.contactInfo.officeLocations.filter(
      (_, i) => i !== index
    );
    await updateContactSettings({
      contactInfo: {
        ...contactSettings.contactInfo,
        officeLocations: newLocations,
      },
    });
  };

  const addSupportChannel = async (channel: ContactPageChannel) => {
    if (!contactSettings) return;
    const newChannels = [...contactSettings.supportChannels.channels, channel];
    await updateContactSettings({
      supportChannels: {
        ...contactSettings.supportChannels,
        channels: newChannels,
      },
    });
  };

  const removeSupportChannel = async (index: number) => {
    if (!contactSettings) return;
    const newChannels = contactSettings.supportChannels.channels.filter(
      (_, i) => i !== index
    );
    await updateContactSettings({
      supportChannels: {
        ...contactSettings.supportChannels,
        channels: newChannels,
      },
    });
  };

  const addFAQQuestion = async (question: ContactPageQuestion) => {
    if (!contactSettings) return;
    const newQuestions = [...contactSettings.faq.questions, question];
    await updateContactSettings({
      faq: {
        ...contactSettings.faq,
        questions: newQuestions,
      },
    });
  };

  const removeFAQQuestion = async (index: number) => {
    if (!contactSettings) return;
    const newQuestions = contactSettings.faq.questions.filter(
      (_, i) => i !== index
    );
    await updateContactSettings({
      faq: {
        ...contactSettings.faq,
        questions: newQuestions,
      },
    });
  };

  const contextValue: ContactPageContextType = {
    contactSettings,
    isLoading,
    error,
    updateContactSettings,
    updateBannerImage,
    updateSupportChannelImage,
    addOfficeLocation,
    removeOfficeLocation,
    addSupportChannel,
    removeSupportChannel,
    addFAQQuestion,
    removeFAQQuestion,
  };

  return (
    <ContactPageContext.Provider value={contextValue}>
      {children}
    </ContactPageContext.Provider>
  );
};

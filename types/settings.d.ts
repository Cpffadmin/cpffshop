interface MultiLangValue {
  en: string;
  "zh-TW": string;
}

interface StoreSettings {
  storeName: MultiLangValue;
  slogan: MultiLangValue;
  copyright: MultiLangValue;
  logo: string;
  contactInfo: {
    email: string;
    phone: string;
    address: {
      street: MultiLangValue;
      city: MultiLangValue;
      postalCode: MultiLangValue;
      country: MultiLangValue;
    };
  };
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
    show: boolean;
    title: MultiLangValue;
    standardShipping: MultiLangValue;
    expressShipping: MultiLangValue;
  };
  returnPolicy: {
    daysToReturn: number;
    conditions: MultiLangValue;
    show: boolean;
    title: MultiLangValue;
  };
  newsletterSettings: {
    title: MultiLangValue;
    subtitle: MultiLangValue;
    bannerImage: string;
    discountPercentage: number;
    buttonText: MultiLangValue;
    disclaimer: MultiLangValue;
  };
}

export type { StoreSettings, MultiLangValue };

import mongoose from "mongoose";

const multiLangSchema = {
  en: {
    type: String,
    default: "",
  },
  "zh-TW": {
    type: String,
    default: "",
  },
};

const privacyPolicySchema = {
  title: {
    en: {
      type: String,
      default: "Privacy Policy",
    },
    "zh-TW": {
      type: String,
      default: "隱私政策",
    },
  },
  subtitle: {
    en: {
      type: String,
      default: "Your Privacy Matters",
    },
    "zh-TW": {
      type: String,
      default: "您的隱私很重要",
    },
  },
  sections: [
    {
      title: {
        en: {
          type: String,
          default: "Information Collection",
        },
        "zh-TW": {
          type: String,
          default: "資訊收集",
        },
      },
      content: {
        en: {
          type: String,
          default:
            "We collect information to provide better services to our users.",
        },
        "zh-TW": {
          type: String,
          default: "我們收集資訊以提供更好的服務給我們的用戶。",
        },
      },
      _id: false,
    },
  ],
  contactInfo: {
    email: { type: String, default: "privacy@chinapower.com" },
    phone: { type: String, default: "+852 1234 5678" },
    address: {
      en: {
        type: String,
        default: "123 Privacy Street, Central, Hong Kong",
      },
      "zh-TW": {
        type: String,
        default: "香港中環私隱街123號",
      },
    },
  },
  lastUpdated: { type: Date, default: Date.now },
};

const storeSettingsSchema = new mongoose.Schema(
  {
    storeName: {
      en: {
        type: String,
        default: "EcomWatch",
      },
      "zh-TW": {
        type: String,
        default: "EcomWatch",
      },
    },
    slogan: {
      en: {
        type: String,
        default: "Your premium watch destination",
      },
      "zh-TW": {
        type: String,
        default: "您的高級手錶目的地",
      },
    },
    copyright: {
      en: {
        type: String,
        default: "© {{year}} {{storeName}}. All rights reserved.",
      },
      "zh-TW": {
        type: String,
        default: "© {{year}} {{storeName}}. 版權所有",
      },
    },
    logo: {
      type: String,
      default: "/logo.png",
    },
    contactInfo: {
      email: {
        type: String,
        required: true,
        default: "support@ecomwatch.com",
      },
      phone: {
        type: String,
        required: true,
        default: "(123) 456-7890",
      },
      address: {
        street: {
          type: String,
          required: true,
          default: "123 Watch Street",
        },
        city: {
          type: String,
          required: true,
          default: "Timepiece City",
        },
        postalCode: {
          type: String,
          required: true,
          default: "TC 12345",
        },
        country: {
          type: String,
          required: true,
          default: "Switzerland",
        },
      },
    },
    businessHours: {
      weekdays: {
        en: {
          type: String,
          default: "Mon-Fri: 9am-6pm",
        },
        "zh-TW": {
          type: String,
          default: "週一至週五: 上午9點至下午6點",
        },
      },
      weekends: {
        en: {
          type: String,
          default: "Sat-Sun: 10am-4pm",
        },
        "zh-TW": {
          type: String,
          default: "週六至週日: 上午10點至下午4點",
        },
      },
    },
    socialMedia: {
      facebook: {
        type: String,
        default: "",
      },
      instagram: {
        type: String,
        default: "",
      },
      twitter: {
        type: String,
        default: "",
      },
    },
    shippingInfo: {
      standardDays: {
        type: String,
        default: "5-7 business days",
      },
      expressDays: {
        type: String,
        default: "2-3 business days",
      },
      internationalShipping: {
        type: Boolean,
        default: true,
      },
      show: {
        type: Boolean,
        default: true,
      },
      title: {
        en: {
          type: String,
          default: "Shipping Information",
        },
        "zh-TW": {
          type: String,
          default: "運送資訊",
        },
      },
      standardShipping: {
        en: {
          type: String,
          default: "Standard Shipping",
        },
        "zh-TW": {
          type: String,
          default: "標準運送",
        },
      },
      expressShipping: {
        en: {
          type: String,
          default: "Express Shipping",
        },
        "zh-TW": {
          type: String,
          default: "快速運送",
        },
      },
    },
    returnPolicy: {
      daysToReturn: {
        type: Number,
        default: 30,
      },
      conditions: {
        en: {
          type: String,
          default:
            "Items must be unworn and in original condition with all tags attached.",
        },
        "zh-TW": {
          type: String,
          default: "商品必須未使用且保持原始狀態，所有標籤必須完整。",
        },
      },
      show: {
        type: Boolean,
        default: true,
      },
      title: {
        en: {
          type: String,
          default: "Return Policy",
        },
        "zh-TW": {
          type: String,
          default: "退貨政策",
        },
      },
    },
    newsletterSettings: {
      title: {
        en: {
          type: String,
          default: "Subscribe to Our Newsletter",
        },
        "zh-TW": {
          type: String,
          default: "訂閱我們的電子報",
        },
      },
      subtitle: {
        en: {
          type: String,
          default: "Get 15% off your first order!",
        },
        "zh-TW": {
          type: String,
          default: "首次訂單可享85折優惠！",
        },
      },
      bannerImage: {
        type: String,
        default: "/images/banner-default.svg",
      },
      discountPercentage: {
        type: Number,
        default: 15,
      },
      buttonText: {
        en: {
          type: String,
          default: "Subscribe Now",
        },
        "zh-TW": {
          type: String,
          default: "立即訂閱",
        },
      },
      disclaimer: {
        en: {
          type: String,
          default:
            "By subscribing, you agree to receive email marketing. You can unsubscribe at any time.",
        },
        "zh-TW": {
          type: String,
          default: "訂閱即表示您同意接收電子郵件行銷。您可以隨時取消訂閱。",
        },
      },
    },
    aboutPage: {
      title: {
        en: {
          type: String,
          default: "About Us",
        },
        "zh-TW": {
          type: String,
          default: "關於我們",
        },
      },
      subtitle: {
        en: {
          type: String,
          default: "Our Story",
        },
        "zh-TW": {
          type: String,
          default: "我們的故事",
        },
      },
      bannerImage: {
        type: String,
        default: "/images/banner-default.svg",
      },
      story: {
        title: {
          en: {
            type: String,
            default: "Our Story",
          },
          "zh-TW": {
            type: String,
            default: "我們的故事",
          },
        },
        content: {
          en: {
            type: String,
            default: "We've been in the business for over 20 years...",
          },
          "zh-TW": {
            type: String,
            default: "我們在這個行業已經超過20年...",
          },
        },
        image: {
          type: String,
          default: "/story-image.jpg",
        },
      },
      values: {
        title: {
          en: {
            type: String,
            default: "Our Values",
          },
          "zh-TW": {
            type: String,
            default: "我們的價值觀",
          },
        },
        items: [
          {
            title: {
              en: {
                type: String,
              },
              "zh-TW": {
                type: String,
              },
            },
            description: {
              en: {
                type: String,
              },
              "zh-TW": {
                type: String,
              },
            },
            icon: {
              type: String,
            },
          },
        ],
      },
      team: {
        title: {
          en: {
            type: String,
            default: "Our Team",
          },
          "zh-TW": {
            type: String,
            default: "我們的團隊",
          },
        },
        members: [
          {
            name: {
              en: {
                type: String,
              },
              "zh-TW": {
                type: String,
              },
            },
            role: {
              en: {
                type: String,
              },
              "zh-TW": {
                type: String,
              },
            },
            image: {
              type: String,
            },
            description: {
              en: {
                type: String,
              },
              "zh-TW": {
                type: String,
              },
            },
          },
        ],
      },
    },
    contactPage: {
      title: {
        en: {
          type: String,
          default: "Contact Us",
        },
        "zh-TW": {
          type: String,
          default: "聯絡我們",
        },
      },
      subtitle: {
        en: {
          type: String,
          default: "Get in Touch",
        },
        "zh-TW": {
          type: String,
          default: "與我們聯繫",
        },
      },
      bannerImage: {
        type: String,
        default: "/images/banner-default.svg",
      },
      contactInfo: {
        title: {
          en: {
            type: String,
            default: "Contact Information",
          },
          "zh-TW": {
            type: String,
            default: "聯絡資訊",
          },
        },
        officeLocations: [
          {
            name: {
              en: {
                type: String,
                default: "",
              },
              "zh-TW": {
                type: String,
                default: "",
              },
            },
            address: {
              en: {
                type: String,
                default: "",
              },
              "zh-TW": {
                type: String,
                default: "",
              },
            },
            phone: {
              type: String,
              default: "",
            },
            email: {
              type: String,
              default: "",
            },
            hours: {
              en: {
                type: String,
                default: "",
              },
              "zh-TW": {
                type: String,
                default: "",
              },
            },
            coordinates: {
              lat: {
                type: Number,
                default: 0,
              },
              lng: {
                type: Number,
                default: 0,
              },
            },
          },
        ],
      },
      supportChannels: {
        title: {
          type: String,
          default: "Our Support Channels",
        },
        image: {
          type: String,
          default: "/images/support-default.svg",
        },
        channels: [
          {
            title: {
              type: String,
            },
            description: {
              type: String,
            },
            icon: {
              type: String,
            },
          },
        ],
      },
      faq: {
        title: {
          en: {
            type: String,
            default: "Frequently Asked Questions",
          },
          "zh-TW": {
            type: String,
            default: "常見問題",
          },
        },
        questions: [
          {
            question: {
              en: {
                type: String,
              },
              "zh-TW": {
                type: String,
              },
            },
            answer: {
              en: {
                type: String,
              },
              "zh-TW": {
                type: String,
              },
            },
          },
        ],
      },
    },
    privacyPolicy: privacyPolicySchema,
  },
  {
    timestamps: true,
  }
);

const StoreSettings =
  mongoose.models.StoreSettings ||
  mongoose.model("StoreSettings", storeSettingsSchema);

export default StoreSettings;

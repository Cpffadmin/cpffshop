"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface DeliverySettings {
  deliveryTypes: {
    local: { cost: number; name: string };
    express: { cost: number; name: string };
    overseas: { cost: number; name: string };
  };
  freeDeliveryThreshold: number;
  bankAccountDetails: string;
}

type DeliveryType = keyof DeliverySettings["deliveryTypes"];

export default function DeliverySettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<DeliverySettings>({
    deliveryTypes: {
      local: { cost: 0, name: "Local Delivery" },
      express: { cost: 0, name: "Express Delivery" },
      overseas: { cost: 0, name: "Overseas Delivery" },
    },
    freeDeliveryThreshold: 0,
    bankAccountDetails: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!session?.user?.admin) {
      router.push("/admin");
      return;
    }

    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/delivery");
        const data = await response.json();
        setSettings({
          ...data,
          bankAccountDetails:
            data.bankAccountDetails || "Bank account details not set",
        });
      } catch (error) {
        console.error("Failed to fetch delivery settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/delivery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#535C91]"></div>
      </div>
    );
  }

  if (!settings) {
    return <div>Failed to load settings</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Delivery Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Delivery Types</h2>
          {Object.entries(settings.deliveryTypes).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <h3 className="font-medium capitalize">{key} Delivery</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={value.name}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        deliveryTypes: {
                          ...settings.deliveryTypes,
                          [key as DeliveryType]: {
                            ...value,
                            name: e.target.value,
                          },
                        },
                      })
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Cost ($)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    min="0"
                    value={value.cost}
                    onFocus={(e) => {
                      e.target.select();
                    }}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      if (newValue === "" || /^\d*\.?\d*$/.test(newValue)) {
                        setSettings({
                          ...settings,
                          deliveryTypes: {
                            ...settings.deliveryTypes,
                            [key as DeliveryType]: {
                              name: settings.deliveryTypes[key as DeliveryType]
                                .name,
                              cost: parseFloat(newValue) || 0,
                            },
                          },
                        });
                      }
                    }}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">
            Free Delivery Threshold
          </h2>
          <div>
            <label className="block text-sm font-medium mb-1">
              Minimum Order Amount for Free Delivery ($)
            </label>
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              min="0"
              value={settings.freeDeliveryThreshold}
              onFocus={(e) => {
                e.target.select();
              }}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || /^\d*\.?\d*$/.test(value)) {
                  setSettings({
                    ...settings,
                    freeDeliveryThreshold: parseFloat(value) || 0,
                  });
                }
              }}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Bank Account Details</h2>
          <div>
            <label className="block text-sm font-medium mb-1">
              Bank Account Details for Offline Payments
            </label>
            <textarea
              value={settings.bankAccountDetails}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  bankAccountDetails: e.target.value,
                })
              }
              placeholder="Enter bank account details for customers to make offline payments"
              className="w-full p-2 border rounded min-h-[100px]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-[#535C91] hover:bg-[#424874] text-white py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}

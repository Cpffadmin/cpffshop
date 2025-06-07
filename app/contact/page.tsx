"use client";

import React, { useEffect, useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  Video,
  Headphones,
  ChevronUp,
  ChevronDown,
  Contact,
} from "lucide-react";
import Image from "next/image";
import LoadingErrorComponent from "@/components/ui/LoadingErrorComponent";
import { useContactPage } from "@/providers/contact/ContactPageContext";
import NewsletterComponent from "@/components/HomepageComponents/NewsletterComponent";
import dynamic from "next/dynamic";
import Script from "next/script";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/providers/language/LanguageContext";
import { Breadcrumb } from "@/components/ui/breadcrumb";

const MapComponent = dynamic(
  () =>
    import("@/components/maps/GoogleMap").catch((err) => {
      console.error("Error loading GoogleMap component:", err);
      const FallbackComponent = () => (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-red-500">Failed to load map</div>
        </div>
      );
      FallbackComponent.displayName = "MapFallback";
      return FallbackComponent;
    }),
  {
    ssr: false,
    loading: () => {
      const LoadingComponent = () => (
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
      LoadingComponent.displayName = "MapLoading";
      return <LoadingComponent />;
    },
  }
);

const ContactPage = () => {
  const { contactSettings, isLoading, error } = useContactPage();
  const { t, language } = useTranslation();
  const [isMapScriptLoaded, setIsMapScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState<Error | null>(null);
  const [selectedLocationIndex, setSelectedLocationIndex] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const breadcrumbItems = [
    {
      label: t("navigation.contact"),
      href: "/contact",
      icon: Contact,
    },
  ];

  useEffect(() => {
    let mounted = true;

    const checkGoogleMapsLoaded = () => {
      try {
        if (typeof window !== "undefined") {
          if (window.google?.maps) {
            if (mounted) {
              setIsMapScriptLoaded(true);
              setScriptError(null);
            }
          } else {
            // If Google Maps isn't loaded yet, check again in 100ms
            setTimeout(checkGoogleMapsLoaded, 100);
          }
        }
      } catch (err) {
        if (mounted) {
          console.error("Error checking Google Maps:", err);
          setScriptError(
            err instanceof Error
              ? err
              : new Error("Failed to check Google Maps status")
          );
        }
      }
    };

    checkGoogleMapsLoaded();

    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading || error) {
    return <LoadingErrorComponent loading={isLoading} error={error} />;
  }

  if (!contactSettings) {
    return null;
  }

  if (scriptError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-500 p-4 rounded-lg shadow-sm">
          Failed to load Google Maps: {scriptError.message}
        </div>
      </div>
    );
  }

  const icons = {
    MapPin,
    Phone,
    Mail,
    Clock,
    MessageCircle,
    Video,
    Headphones,
  };

  const locations = contactSettings.contactInfo.officeLocations.map(
    (location, index) => {
      const coordinates = {
        lat:
          typeof location.coordinates?.lat === "number"
            ? location.coordinates.lat
            : typeof location.coordinates?.lat === "string"
            ? parseFloat(location.coordinates.lat)
            : 22.3927,
        lng:
          typeof location.coordinates?.lng === "number"
            ? location.coordinates.lng
            : typeof location.coordinates?.lng === "string"
            ? parseFloat(location.coordinates.lng)
            : 113.9735,
      };

      console.log(`Location ${index} (${location.name[language]}):`, {
        name: location.name[language],
        address: location.address[language],
        coordinates,
      });

      return {
        name: location.name[language],
        address: location.address[language],
        coordinates,
      };
    }
  );

  console.log("All locations:", locations);

  const handleLocationSelect = (index: number) => {
    console.log(`Tab selected: ${index}`);
    setSelectedLocationIndex(index);
  };

  // Get the currently selected location
  const selectedLocation = locations[selectedLocationIndex];
  console.log("Currently selected location:", selectedLocation);

  // Always show all locations on the map
  console.log("Showing all locations on map:", locations);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=Function.prototype`}
        strategy="afterInteractive"
        onLoad={() => {
          console.log("Google Maps script loaded successfully");
          setIsMapScriptLoaded(true);
          setScriptError(null);
        }}
        onError={(e) => {
          console.error("Error loading Google Maps script:", e);
          // Check if the error is related to the API key
          const error =
            e instanceof Error ? e : new Error("Failed to load Google Maps");
          if (
            error.message.includes("InvalidKeyMapError") ||
            error.message.includes("RefererNotAllowedMapError")
          ) {
            setScriptError(
              new Error(
                "Google Maps API key error - please check API key configuration"
              )
            );
          } else {
            setScriptError(error);
          }
          setIsMapScriptLoaded(false);
        }}
      />

      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumb items={breadcrumbItems} />
        </div>
        <header className="bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {contactSettings.title[language]}
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              {contactSettings.subtitle[language]}
            </p>
            <div className="max-w-4xl mx-auto">
              <Image
                src={
                  contactSettings.bannerImage || "/images/banner-default.svg"
                }
                alt="Contact Banner"
                width={1200}
                height={400}
                className="rounded-lg shadow-lg mx-auto"
                priority
              />
            </div>
          </div>
        </header>

        <section className="py-8">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-2xl font-bold text-center mb-8 text-foreground">
              {contactSettings.contactInfo.title[language]}
            </h2>

            <div className="grid md:grid-cols-12 gap-8">
              <div className="md:col-span-8">
                <div
                  className="bg-card dark:bg-card rounded-lg h-full border border-border"
                  style={{ position: "relative", minHeight: "400px" }}
                >
                  {isMapScriptLoaded && locations.length > 0 && (
                    <div
                      key={`map-container-${Date.now()}`}
                      className="absolute inset-0"
                    >
                      <MapComponent locations={locations} defaultZoom={15} />
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-4">
                <Tabs
                  defaultValue="0"
                  className="w-full"
                  onValueChange={(value) =>
                    handleLocationSelect(parseInt(value))
                  }
                >
                  <TabsList className="w-full mb-6 flex bg-card dark:bg-card/80 rounded-lg p-1 border border-border">
                    {contactSettings.contactInfo.officeLocations.map(
                      (location, index) => (
                        <TabsTrigger
                          key={index}
                          value={index.toString()}
                          className="flex-1 px-4 py-2.5 text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all hover:text-foreground"
                        >
                          {location.name[language]}
                        </TabsTrigger>
                      )
                    )}
                  </TabsList>

                  {contactSettings.contactInfo.officeLocations.map(
                    (location, index) => (
                      <TabsContent
                        key={index}
                        value={index.toString()}
                        className="mt-0"
                      >
                        <div className="space-y-4 bg-card rounded-lg p-6 shadow-sm border border-border">
                          <div className="border-b border-border pb-4">
                            <h3 className="text-lg font-semibold text-foreground">
                              {location.name[language]}
                            </h3>
                          </div>
                          <div className="space-y-4 pt-2">
                            <div className="flex items-start gap-3">
                              <MapPin className="w-5 h-5 text-primary mt-1" />
                              <p className="text-muted-foreground">
                                {location.address[language]}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <Phone className="w-5 h-5 text-primary" />
                              <p className="text-muted-foreground">
                                {location.phone}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <Mail className="w-5 h-5 text-primary" />
                              <p className="text-muted-foreground">
                                {location.email}
                              </p>
                            </div>
                            <div className="flex items-start gap-3">
                              <Clock className="w-5 h-5 text-primary mt-1" />
                              <p className="text-muted-foreground whitespace-pre-line">
                                {location.hours[language]}
                              </p>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    )
                  )}
                </Tabs>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-card py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-1/2">
                <Image
                  src={contactSettings.supportChannels.image}
                  alt="Support Channels"
                  width={600}
                  height={600}
                  className="rounded-lg shadow-lg w-full"
                  priority
                />
              </div>
              <div className="md:w-1/2">
                <h2 className="text-3xl md:text-2xl font-bold mb-8 text-foreground">
                  {contactSettings.supportChannels.title[language]}
                </h2>
                <div className="space-y-6">
                  {contactSettings.supportChannels.channels.map(
                    (channel, index) => {
                      const IconComponent =
                        icons[channel.icon as keyof typeof icons];
                      return (
                        <div key={index} className="flex items-center">
                          {IconComponent && (
                            <IconComponent className="w-8 h-8 text-primary mr-4" />
                          )}
                          <div>
                            <h3 className="text-xl font-semibold text-foreground">
                              {channel.title[language]}
                            </h3>
                            <p className="text-muted-foreground">
                              {channel.description[language]}
                            </p>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto px-4">
            <div id="faq-section" className="pt-40 -mt-40">
              <h2 className="text-3xl md:text-2xl font-bold text-center mb-12 text-foreground">
                {contactSettings.faq.title[language]}
              </h2>
              <div className="max-w mx-auto">
                {contactSettings.faq.questions.map((faq, index) => (
                  <div key={index} className="mb-2">
                    <button
                      className="flex justify-between items-center w-full  p-2 rounded-lg shadow-md hover:shadow-lg transition duration-300"
                      onClick={() => toggleFaq(index)}
                    >
                      <h3 className="text-lg font-semibold text-left text-foreground">
                        {faq.question[language]}
                      </h3>
                      {openFaqIndex === index ? (
                        <ChevronUp className="w-6 h-4 text-primary" />
                      ) : (
                        <ChevronDown className="w-6 h-4 text-primary" />
                      )}
                    </button>
                    {openFaqIndex === index && (
                      <div className="bg-card mt-2 p-2 rounded-lg shadow-md">
                        <p className="text-muted-foreground">
                          {faq.answer[language]}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {contactSettings.shippingInfo?.show && (
              <section className="py-8">
                <div className="container mx-auto px-4">
                  <div id="shipping-returns-section" className="pt-40 -mt-40">
                    <h2 className="text-3xl md:text-2xl font-bold text-center mb-12 text-foreground">
                      {contactSettings.shippingInfo.title[language]}
                    </h2>
                    <div className="max-w mx-auto space-y-4">
                      <div className="mb-2">
                        <div className="bg-card mt-2 p-6 rounded-lg shadow-md">
                          <h3 className="text-lg font-semibold mb-4">
                            {
                              contactSettings.shippingInfo.standardShipping[
                                language
                              ]
                            }
                          </h3>
                          <p className="text-muted-foreground">
                            {contactSettings.shippingInfo.standardDays}
                          </p>
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="bg-card mt-2 p-6 rounded-lg shadow-md">
                          <h3 className="text-lg font-semibold mb-4">
                            {
                              contactSettings.shippingInfo.expressShipping[
                                language
                              ]
                            }
                          </h3>
                          <p className="text-muted-foreground">
                            {contactSettings.shippingInfo.expressDays}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {contactSettings.returnPolicy?.show && (
              <section className="py-8">
                <div className="container mx-auto px-4">
                  <div className="pt-40 -mt-40">
                    <h2 className="text-3xl md:text-2xl font-bold text-center mb-12 text-foreground">
                      {contactSettings.returnPolicy.title[language]}
                    </h2>
                    <div className="max-w mx-auto">
                      <div className="mb-2">
                        <div className="bg-card mt-2 p-6 rounded-lg shadow-md">
                          <p className="text-muted-foreground mb-4">
                            {contactSettings.returnPolicy.conditions[language]}
                          </p>
                          <p className="text-muted-foreground">
                            {contactSettings.returnPolicy.daysToReturn}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </section>

        <NewsletterComponent />
      </div>
    </>
  );
};

export default ContactPage;

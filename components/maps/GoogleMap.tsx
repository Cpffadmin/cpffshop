"use client";

import { useEffect, useRef } from "react";

interface Location {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface GoogleMapProps {
  locations: Location[];
  defaultZoom?: number;
}

const GoogleMap = ({ locations, defaultZoom = 15 }: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Safety checks
    if (!mapRef.current) {
      console.error("Map initialization failed - map container not found");
      return;
    }
    if (!window.google?.maps) {
      console.error("Map initialization failed - Google Maps not loaded");
      return;
    }
    if (locations.length === 0) {
      console.error("Map initialization failed - no locations provided");
      return;
    }

    console.log("Initializing map with locations:", locations);

    // Force destroy any existing map instance
    while (mapRef.current.firstChild) {
      mapRef.current.removeChild(mapRef.current.firstChild);
    }

    try {
      // Create a new map instance
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: defaultZoom,
        center: locations[0].coordinates,
        mapTypeId: "roadmap",
        fullscreenControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        zoomControl: true,
      });

      // Create bounds object
      const bounds = new google.maps.LatLngBounds();

      // Clear any existing markers
      const markers: google.maps.Marker[] = [];
      const infoWindows: google.maps.InfoWindow[] = [];

      // Add markers for all locations
      locations.forEach((location) => {
        console.log(
          `Creating marker for ${location.name}:`,
          location.coordinates
        );

        const marker = new google.maps.Marker({
          position: location.coordinates,
          map: map,
          title: location.name,
          animation: google.maps.Animation.DROP,
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 12px; min-width: 200px; max-width: 300px;">
              <h3 style="margin: 0 0 8px 0; color: #333; font-weight: bold; font-size: 16px;">${location.name}</h3>
              <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.4;">${location.address}</p>
            </div>
          `,
        });

        marker.addListener("click", () => {
          // Close all other info windows
          infoWindows.forEach((iw) => iw.close());
          infoWindow.open(map, marker);
        });

        // Store markers and info windows for cleanup
        markers.push(marker);
        infoWindows.push(infoWindow);

        // Extend bounds
        bounds.extend(location.coordinates);
      });

      // Fit bounds with padding
      map.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50,
      });

      // Adjust zoom level after a short delay
      setTimeout(() => {
        const currentZoom = map.getZoom();
        if (
          locations.length === 1 &&
          currentZoom &&
          currentZoom > defaultZoom
        ) {
          map.setZoom(defaultZoom);
        } else if (currentZoom && currentZoom > 15) {
          map.setZoom(15);
        }

        // Center the map on the bounds
        map.setCenter(bounds.getCenter());
      }, 100);

      // Cleanup function
      return () => {
        markers.forEach((marker) => marker.setMap(null));
        infoWindows.forEach((iw) => iw.close());
      };
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }, [locations, defaultZoom]); // Re-run when locations or zoom changes

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "400px",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
      }}
    />
  );
};

export default GoogleMap;

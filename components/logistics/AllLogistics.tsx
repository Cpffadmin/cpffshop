"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/providers/language/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Truck, Search } from "lucide-react";
import Link from "next/link";
import type { LogisticsVehicle } from "@/types/logistics";

export default function AllLogistics({
  viewMode,
}: {
  viewMode: "table" | "grid";
}) {
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState<LogisticsVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await fetch("/api/logistics");
      if (!response.ok) throw new Error("Failed to fetch vehicles");
      const data = await response.json();
      setVehicles(data);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "on delivery":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "out of service":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusTranslationKey = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return "available";
      case "on delivery":
        return "onDelivery";
      case "maintenance":
        return "maintenance";
      case "out of service":
        return "outOfService";
      default:
        return status;
    }
  };

  const getLocationTranslationKey = (location: string) => {
    switch (location.toLowerCase()) {
      case "hong kong":
        return "hongKong";
      case "new territories":
        return "newTerritories";
      default:
        return location.toLowerCase();
    }
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.registrationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.assignedLocation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      vehicle.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#535C91]"></div>
          <span>{t("logistics.loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto flex-1">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder={t("common.search")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <div className="w-full sm:w-40">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("logistics.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  <SelectItem value="available">
                    {t("logistics.statusTypes.available")}
                  </SelectItem>
                  <SelectItem value="on delivery">
                    {t("logistics.statusTypes.onDelivery")}
                  </SelectItem>
                  <SelectItem value="maintenance">
                    {t("logistics.statusTypes.maintenance")}
                  </SelectItem>
                  <SelectItem value="out of service">
                    {t("logistics.statusTypes.outOfService")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Link href="/admin/logistics/create">
            <Button>
              <Truck className="mr-2 h-4 w-4" />
              {t("logistics.addVehicle")}
            </Button>
          </Link>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <div
                key={vehicle._id.toString()}
                className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow p-4 flex flex-col gap-2"
              >
                <div className="font-semibold text-lg text-gray-900 dark:text-gray-100 break-all">
                  {vehicle.registrationNo}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {vehicle.make} {vehicle.model} ({vehicle.makeYear})
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t("logistics.driverName")}: {vehicle.driver.name} (
                  {vehicle.driver.contactNo})
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>{t("logistics.status")}:</span>
                  <Badge className={getStatusColor(vehicle.status)}>
                    {t(
                      `logistics.statusTypes.${getStatusTranslationKey(
                        vehicle.status
                      )}`
                    )}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {t("logistics.assignedLocation")}:{" "}
                  {t(
                    `logistics.locations.${getLocationTranslationKey(
                      vehicle.assignedLocation
                    )}`
                  )}
                </div>
                <div className="flex justify-end mt-2">
                  <Link href={`/admin/logistics/${vehicle._id}`}>
                    <Button variant="outline" size="sm">
                      {t("logistics.viewDetails")}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("logistics.vehicleDetails")}</TableHead>
                <TableHead>{t("logistics.driverInfo")}</TableHead>
                <TableHead>{t("logistics.vehicleStatus")}</TableHead>
                <TableHead>{t("logistics.assignedLocation")}</TableHead>
                <TableHead className="text-right">
                  {t("common.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle._id.toString()}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{vehicle.registrationNo}</p>
                      <p className="text-sm text-gray-500">
                        {vehicle.make} {vehicle.model} ({vehicle.makeYear})
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{vehicle.driver.name}</p>
                      <p className="text-sm text-gray-500">
                        {vehicle.driver.contactNo}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(vehicle.status)}>
                      {t(
                        `logistics.statusTypes.${getStatusTranslationKey(
                          vehicle.status
                        )}`
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {t(
                      `logistics.locations.${getLocationTranslationKey(
                        vehicle.assignedLocation
                      )}`
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/logistics/${vehicle._id}`}>
                      <Button variant="outline" size="sm">
                        {t("logistics.viewDetails")}
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

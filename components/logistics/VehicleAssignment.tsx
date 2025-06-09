"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/providers/language/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Truck, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import type { LogisticsVehicle } from "@/types/logistics";

interface VehicleAssignmentProps {
  orderId: string;
  currentStatus: string;
  onAssignmentComplete?: () => void;
}

export default function VehicleAssignment({
  orderId,
  currentStatus,
  onAssignmentComplete,
}: VehicleAssignmentProps) {
  const { t } = useTranslation();
  const [availableVehicles, setAvailableVehicles] = useState<
    LogisticsVehicle[]
  >([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [assignedVehicle, setAssignedVehicle] =
    useState<LogisticsVehicle | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<Date>();

  // Fetch available vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch("/api/logistics?status=Available");
        if (!response.ok) throw new Error("Failed to fetch vehicles");
        const data = await response.json();
        setAvailableVehicles(data);
      } catch (error) {
        console.error("Error fetching vehicles:", error);
        toast.error("Failed to load available vehicles");
      }
    };

    fetchVehicles();
  }, []);

  // Check if order already has an assigned vehicle
  useEffect(() => {
    const checkAssignment = async () => {
      try {
        const response = await fetch(
          `/api/logistics/assign?orderId=${orderId}`
        );
        if (!response.ok) throw new Error("Failed to fetch assignment");
        const data = await response.json();
        if (data.vehicle) {
          setAssignedVehicle(data.vehicle);
          // If there's a scheduled delivery date, set it
          const assignedOrder = data.vehicle.assignedOrders?.find(
            (ao: { orderId: { toString: () => string } }) =>
              ao.orderId.toString() === orderId
          );
          if (assignedOrder?.scheduledDeliveryDate) {
            setDeliveryDate(new Date(assignedOrder.scheduledDeliveryDate));
          }
        }
      } catch (error) {
        console.error("Error checking assignment:", error);
      }
    };

    checkAssignment();
  }, [orderId]);

  const handleAssign = async () => {
    if (!selectedVehicle) {
      toast.error("Please select a vehicle");
      return;
    }

    if (!deliveryDate) {
      toast.error("Please select a delivery date");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/logistics/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicleId: selectedVehicle,
          orderId,
          scheduledDeliveryDate: deliveryDate,
        }),
      });

      if (!response.ok) throw new Error("Failed to assign vehicle");

      const data = await response.json();
      setAssignedVehicle(data);
      toast.success("Vehicle assigned successfully");
      if (onAssignmentComplete) {
        onAssignmentComplete();
      }
    } catch (error) {
      console.error("Error assigning vehicle:", error);
      toast.error("Failed to assign vehicle");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!assignedVehicle) return;

    try {
      const response = await fetch("/api/logistics/assign", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicleId: assignedVehicle._id,
          orderId,
          status: newStatus,
        }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      const data = await response.json();
      setAssignedVehicle(data);
      toast.success("Status updated successfully");
      if (onAssignmentComplete) {
        onAssignmentComplete();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
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

  if (currentStatus !== "processing") {
    return (
      <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
        <AlertCircle className="h-5 w-5" />
        <span>Order must be in processing status to assign a vehicle</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {t("logistics.vehicleAssignment.title")}
      </h3>

      {assignedVehicle ? (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-[#535C91] dark:text-[#6B74A9]" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {assignedVehicle.registrationNo}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("logistics.vehicleAssignment.driverName")}:{" "}
                {assignedVehicle.driver.name}
              </p>
              {deliveryDate && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("logistics.vehicleAssignment.scheduledDelivery")}:{" "}
                  {format(deliveryDate, "PPP")}
                </p>
              )}
            </div>
            <Badge className={getStatusColor(assignedVehicle.status)}>
              {assignedVehicle.status}
            </Badge>
          </div>

          <div className="flex gap-2">
            <Select onValueChange={handleStatusUpdate}>
              <SelectTrigger className="w-[180px]">
                <SelectValue
                  placeholder={t("logistics.vehicleAssignment.updateStatus")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">
                  {t("logistics.vehicleAssignment.status.pending")}
                </SelectItem>
                <SelectItem value="In Transit">
                  {t("logistics.vehicleAssignment.status.inTransit")}
                </SelectItem>
                <SelectItem value="Delivered">
                  {t("logistics.vehicleAssignment.status.delivered")}
                </SelectItem>
                <SelectItem value="Failed">
                  {t("logistics.vehicleAssignment.status.failed")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <div className="w-full sm:w-auto sm:flex-1">
              <Select
                value={selectedVehicle}
                onValueChange={setSelectedVehicle}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t("logistics.vehicleAssignment.selectVehicle")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableVehicles.map((vehicle) => (
                    <SelectItem
                      key={vehicle._id.toString()}
                      value={vehicle._id.toString()}
                    >
                      {vehicle.registrationNo} - {vehicle.driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={
                      !deliveryDate ? "text-muted-foreground" : undefined
                    }
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deliveryDate
                      ? format(deliveryDate, "PPP")
                      : t("logistics.vehicleAssignment.pickDeliveryDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deliveryDate}
                    onSelect={setDeliveryDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>

              <Button
                onClick={handleAssign}
                disabled={loading || !selectedVehicle || !deliveryDate}
              >
                {loading
                  ? t("logistics.vehicleAssignment.assigningVehicle")
                  : t("logistics.vehicleAssignment.assignVehicle")}
              </Button>
            </div>
          </div>
          {availableVehicles.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("logistics.vehicleAssignment.noVehicles")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

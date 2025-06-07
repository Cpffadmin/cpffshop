import { Types } from "mongoose";

export type BodyType = "Van" | "Truck" | "Lorry" | "Motorcycle";
export type LocationType = "Hong Kong" | "Kowloon" | "New Territories";
export type DeliveryStatus = "Pending" | "In Transit" | "Delivered" | "Failed";
export type VehicleStatus =
  | "Available"
  | "On Delivery"
  | "Maintenance"
  | "Out of Service";

export interface Driver {
  name: string;
  licenseNo: string;
  contactNo: string;
  email?: string;
}

export interface MaintenanceRecord {
  date: Date;
  description: string;
  cost: number;
  nextMaintenanceDate: Date;
}

export interface AssignedOrder {
  orderId: Types.ObjectId;
  assignedAt: Date;
  scheduledDeliveryDate: Date;
  status: DeliveryStatus;
  deliveryNotes?: string;
}

export interface LogisticsVehicle {
  _id: Types.ObjectId;
  registrationNo: string;
  owner: string;
  makeYear: number;
  make: string;
  model: string;
  chassisNo: string;
  weight: number;
  cylinderCapacity: number;
  bodyType: BodyType;
  driver: Driver;
  assignedLocation: LocationType;
  assignedDate: Date;
  assignedOrders: AssignedOrder[];
  status: VehicleStatus;
  maintenanceRecords: MaintenanceRecord[];
  createdAt: Date;
  updatedAt: Date;
  vehicleAge: number;
  isAvailableForAssignment: () => boolean;
  assignOrder: (orderId: string) => Promise<LogisticsVehicle>;
}

import mongoose from "mongoose";

const logisticsSchema = new mongoose.Schema(
  {
    // Vehicle Information
    registrationNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    owner: {
      type: String,
      required: true,
      trim: true,
    },
    makeYear: {
      type: Number,
      required: true,
    },
    make: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    chassisNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    weight: {
      type: Number, // in kg
      required: true,
    },
    cylinderCapacity: {
      type: Number, // in cc
      required: true,
    },
    bodyType: {
      type: String,
      required: true,
      enum: ["Van", "Truck", "Lorry", "Motorcycle"],
    },
    // Driver Information
    driver: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      licenseNo: {
        type: String,
        required: true,
        trim: true,
      },
      contactNo: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
    },
    // Assignment Information
    assignedLocation: {
      type: String,
      required: true,
      enum: ["Hong Kong", "Kowloon", "New Territories"],
    },
    assignedDate: {
      type: Date,
      required: true,
    },
    // Order Assignment
    assignedOrders: [
      {
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
        },
        assignedAt: {
          type: Date,
          default: Date.now,
        },
        scheduledDeliveryDate: {
          type: Date,
          required: true,
        },
        status: {
          type: String,
          enum: ["Pending", "In Transit", "Delivered", "Failed"],
          default: "Pending",
        },
        deliveryNotes: String,
      },
    ],
    // Vehicle Status
    status: {
      type: String,
      enum: ["Available", "On Delivery", "Maintenance", "Out of Service"],
      default: "Available",
    },
    // Maintenance Records
    maintenanceRecords: [
      {
        date: Date,
        description: String,
        cost: Number,
        nextMaintenanceDate: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
logisticsSchema.index({ assignedLocation: 1 });
logisticsSchema.index({ status: 1 });
logisticsSchema.index({ "assignedOrders.orderId": 1 });

// Virtual for vehicle age
logisticsSchema.virtual("vehicleAge").get(function () {
  return new Date().getFullYear() - this.makeYear;
});

// Method to check if vehicle is available for assignment
logisticsSchema.methods.isAvailableForAssignment = function () {
  return this.status === "Available" && this.assignedOrders.length === 0;
};

// Method to assign order
logisticsSchema.methods.assignOrder = function (orderId: string) {
  if (!this.isAvailableForAssignment()) {
    throw new Error("Vehicle is not available for assignment");
  }

  this.assignedOrders.push({
    orderId,
    assignedAt: new Date(),
    status: "Pending",
  });

  this.status = "On Delivery";
  return this.save();
};

export const Logistics =
  mongoose.models?.Logistics || mongoose.model("Logistics", logisticsSchema);

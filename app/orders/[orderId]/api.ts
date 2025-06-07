import axios from "axios";
import { Order } from "@/types";

export const fetchOrder = async (orderId: string): Promise<Order> => {
  try {
    const response = await axios.get(`/api/orders/${orderId}`);
    if (response.status === 200) {
      return response.data;
    }
    throw new Error("Failed to fetch order");
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("An error occurred while fetching the order");
  }
};

"use client";
import React from "react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import useCartStore from "@/store/cartStore";

const Dashboard = () => {
  const { data: session } = useSession();
  const clearCart = useCartStore((state) => state.clearCart);

  const handleLogout = async () => {
    try {
      clearCart(); // Clear the cart before logging out
      await signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen p-20 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h2 className="text-lg font-semibold text-center text-slate-800">
            Welcome to the Dashboard
          </h2>
        </CardHeader>
        <CardContent className="text-center">
          {session && (
            <span className="text-sm font-semibold text-slate-600">
              {session.user.name}
            </span>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            onClick={handleLogout}
            variant="default"
            className="text-white uppercase"
          >
            Logout
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Dashboard;

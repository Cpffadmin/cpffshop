import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import useCartStore from "@/store/cartStore";

const ProfileWithLogout = () => {
  const { data: session } = useSession();
  const user = session?.user;
  const [isHovered, setIsHovered] = useState(false);
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
    <div
      className="relative flex items-center pr-8 mt-2"
      onMouseEnter={() => setIsHovered(true)}
    >
      <div className="text-center font-semibold mr-2">Profile</div>
      <div className="relative">
        <Avatar
          className="h-10 w-10 hover:border-2 border-emerald-500 transition-all duration-100"
          onMouseEnter={() => setIsHovered(true)}
        >
          <AvatarImage
            src={user?.image || "/default-avatar.png"}
            alt={user?.name || "User"}
          />
          <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
        </Avatar>
        {isHovered && (
          <div
            onMouseLeave={() => setIsHovered(false)}
            className="absolute z-20 top-full right-0 mt-4 w-32 bg-white border border-gray-200 rounded-md shadow-lg"
          >
            <button className="w-full flex justify-center px-4 py-2 text-left hover:bg-gray-100">
              <Link href="/profile">Profile</Link>
            </button>
            <Button
              variant="destructive"
              onMouseEnter={() => setIsHovered(true)}
              className="w-full flex justify-center px-4 py-2 text-left"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileWithLogout;

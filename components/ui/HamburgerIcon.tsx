import React from "react";

interface HamburgerIconProps {
  isOpen: boolean;
}

const HamburgerIcon: React.FC<HamburgerIconProps> = ({ isOpen }) => {
  return (
    <div className="relative w-5 h-5 flex items-center justify-center">
      <span
        className={`absolute w-5 h-[2px] rounded-sm bg-white transform transition-transform duration-500 ease-out ${
          isOpen ? "rotate-45" : "-translate-y-2"
        }`}
      />
      <span
        className={`absolute w-5 h-[2px] rounded-sm bg-white transform transition-opacity duration-500 ease-out ${
          isOpen ? "opacity-0" : "opacity-100"
        }`}
      />
      <span
        className={`absolute w-5 h-[2px] rounded-sm bg-white transform transition-transform duration-500 ease-out ${
          isOpen ? "-rotate-45" : "translate-y-2"
        }`}
      />
    </div>
  );
};

export default HamburgerIcon;

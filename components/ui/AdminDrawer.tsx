import React from "react";
import { Shield, Star } from "lucide-react";
import Link from "next/link";

export default function AdminDrawerLinks() {
  return (
    <ul>
      <li>
        <Link
          href="/admin/guaranteeSection"
          className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
        >
          <Shield className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          <span className="ml-3">Guarantee Section</span>
        </Link>
      </li>
      <li>
        <Link
          href="/admin/featuresSection"
          className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
        >
          <Star className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          <span className="ml-3">Features Section</span>
        </Link>
      </li>
    </ul>
  );
}

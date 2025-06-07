import React from "react";

interface LoadingSkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = "",
  width = "w-full",
  height = "h-4",
  rounded = true,
}) => {
  return (
    <div
      className={`${width} ${height} ${
        rounded ? "rounded" : ""
      } bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`}
    />
  );
};

export default LoadingSkeleton;

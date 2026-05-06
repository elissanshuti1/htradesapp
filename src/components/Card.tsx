import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = "", hover = true }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all ${
        hover ? "hover:shadow-md hover:border-gray-300" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

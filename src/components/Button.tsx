import Link from "next/link";
import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  size?: "sm" | "md";
  href?: string;
  onClick?: () => void;
  className?: string;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  onClick,
  className = "",
}: ButtonProps) {
  const base = "inline-flex items-center justify-center font-semibold transition-colors";
  const variants = {
    primary: "bg-primary-600 text-white shadow-sm hover:bg-primary-700",
    secondary: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
  };
  const sizes = {
    sm: "px-4 py-2 text-sm rounded-md",
    md: "px-5 py-2.5 text-sm rounded-md",
  };
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button onClick={onClick} className={cls}>{children}</button>;
}

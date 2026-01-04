import * as React from "react";
import { cn } from "@/lib/utils";

interface BrandLogoProps extends React.HTMLAttributes<HTMLImageElement> {
  variant?: "primary" | "secondary";
  size?: number; // pixel size for height; width auto
}

const BrandLogo: React.FC<BrandLogoProps> = ({ variant = "primary", size = 32, className, ...props }) => {
  // Using a single asset for both themes; if a dark-specific asset is provided later, swap by `dark:` classnames
  const src = "/logo.png";
  const alt = variant === "secondary" ? "Cabernet Wine Club Mark" : "Cabernet Wine Club Logo";
  return (
    <img
      src={src}
      alt={alt}
      height={size}
      style={{ height: size, width: "auto" }}
      className={cn("select-none", className)}
      {...props}
    />
  );
};

export default BrandLogo;

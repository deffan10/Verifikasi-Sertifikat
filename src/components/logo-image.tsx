"use client";

import { useEffect, useState } from "react";
import { Shield } from "lucide-react";

export function LogoImage({ className = "h-8 w-8" }: { className?: string }) {
  const [logoUrl, setLogoUrl] = useState<string>("");

  useEffect(() => {
    fetch("/api/settings?key=logo_url")
      .then((res) => res.json())
      .then((data) => {
        if (data.value) setLogoUrl(data.value);
      })
      .catch(() => {});
  }, []);

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="Logo"
        className={`${className} object-contain`}
      />
    );
  }

  return <Shield className={`${className} text-primary`} />;
}

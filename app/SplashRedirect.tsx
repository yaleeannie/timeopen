"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
  destination: "/owner" | "/login";
};

export default function SplashRedirect({ destination }: Props) {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.replace(destination);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [destination, router]);

  return null;
}

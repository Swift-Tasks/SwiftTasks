"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";

const HIDDEN_NAVBAR_ROUTES = ["/signin", "/signup"];

export function ConditionalNavbar() {
  const pathname = usePathname();

  if (HIDDEN_NAVBAR_ROUTES.includes(pathname)) {
    return null;
  }

  return <Navbar />;
}

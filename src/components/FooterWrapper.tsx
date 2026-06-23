"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function FooterWrapper() {
  const pathname = usePathname();
  if (pathname?.startsWith("/town/3d")) return null;
  return <Footer />;
}

"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";

const DashboardLayout = dynamic(() => import("./DashboardLayout"), {
  ssr: false,
});

export default function Layout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

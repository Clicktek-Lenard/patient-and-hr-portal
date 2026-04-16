import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LandingPage from "@/components/landing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Patient & HR Portal",
  icons: {
    icon: "/ico.png",
    apple: "/ico.png",
  },
};

export default async function RootPage() {
  const session = await auth();
  if (session?.user?.id) {
    const role = (session.user as { role?: string }).role;
    redirect(role === "HR" || role === "ADMIN" ? "/hr/dashboard" : "/dashboard");
  }
  return <LandingPage />;
}

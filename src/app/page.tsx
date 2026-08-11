import type { Metadata } from "next";
import HomeClient from "@/components/HomeClient";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <main className="w-full min-h-screen bg-maj-cream">
      <HomeClient />
    </main>
  );
}

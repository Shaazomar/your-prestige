import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Sidebar } from "@/components/admin/Sidebar";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — Prestige Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0c0c0b] text-white">
      <Sidebar />
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/8 bg-[#0c0c0b]/85 px-6 backdrop-blur-xl">
          <p className="text-sm text-white/40">
            Prestige Command Center
          </p>
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 rounded-full border border-white/12 px-4 py-2 text-xs font-medium text-white/70 transition-colors hover:border-gold hover:text-gold"
          >
            View Website
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </header>
        <main className="p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}

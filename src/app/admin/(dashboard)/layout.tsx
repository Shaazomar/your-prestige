import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/admin/Sidebar";
import { MobileNav } from "@/components/admin/MobileNav";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — Prestige Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  // Defense in depth — middleware already guards this route, but a layout
  // that renders admin data should never trust that alone.
  if (!session?.user) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-[#0c0c0b] text-white">
      <Toaster theme="dark" position="top-right" richColors closeButton />
      <Sidebar user={session.user} />
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-white/8 bg-black px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <MobileNav user={session.user} />
            <p className="truncate text-sm text-white/40">
              Signed in as <span className="text-white/70">{session.user.name}</span>
            </p>
          </div>
          <Link
            href="/"
            target="_blank"
            className="flex shrink-0 items-center gap-2 rounded-full border border-white/12 px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:border-gold hover:text-gold sm:px-4"
          >
            <span className="hidden sm:inline">View Website</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </header>
        <main className="p-4 sm:p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}

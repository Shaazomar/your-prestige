import type { Metadata } from "next";
import { AcceptInviteForm } from "./AcceptInviteForm";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = { title: "Accept Invite", robots: { index: false, follow: false } };

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0c0c0b] px-6 text-white">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center text-center">
          <Logo size="lg" tone="light" stacked />
          <p className="mt-4 text-[0.65rem] uppercase tracking-[0.35em] text-white/30">Command Center</p>
        </div>
        <div className="rounded-3xl border border-white/8 bg-[#141413] p-8">
          <h1 className="mb-1 text-xl font-semibold">Welcome aboard</h1>
          <p className="mb-7 text-sm text-white/40">Set a password to activate your account.</p>
          {token ? <AcceptInviteForm token={token} /> : <p className="text-sm text-red-300">Missing invite token.</p>}
        </div>
      </div>
    </div>
  );
}

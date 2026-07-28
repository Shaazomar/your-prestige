import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign In — Prestige Admin",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0c0c0b] px-6 text-white">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-white">
            Your <span className="text-gold">Prestige</span>
          </p>
          <p className="mt-1 text-[0.65rem] uppercase tracking-[0.35em] text-white/30">
            Command Center
          </p>
        </div>
        <div className="rounded-3xl border border-white/8 bg-[#141413] p-8">
          <h1 className="mb-1 text-xl font-semibold">Sign in</h1>
          <p className="mb-7 text-sm text-white/40">Enter your admin credentials to continue.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

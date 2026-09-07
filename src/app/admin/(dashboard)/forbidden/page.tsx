import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { auth } from "@/lib/auth";

export const metadata = { title: "Access denied" };

export default async function ForbiddenPage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string; from?: string }>;
}) {
  const { module, from } = await searchParams;
  const session = await auth();

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-white/8 bg-[#141413] p-10 text-center">
      <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
        <ShieldAlert className="h-6 w-6 text-red-400" />
      </span>
      <h1 className="text-xl font-semibold text-white">Access denied</h1>
      <p className="mt-2 text-sm leading-relaxed text-white/45">
        Your role{session?.user?.role ? ` (${session.user.role.replace(/_/g, " ").toLowerCase()})` : ""} does not
        have access to{module ? ` the ${module} module` : " this section"}.
        {from ? <> Requested: <span className="font-mono text-white/60">{from}</span>.</> : null}
      </p>
      <Link
        href="/admin"
        className="mt-6 inline-flex items-center rounded-xl border border-white/12 px-4 py-2 text-xs font-semibold text-white/75 transition-colors hover:border-gold hover:text-gold"
      >
        Back to dashboard
      </Link>
    </div>
  );
}

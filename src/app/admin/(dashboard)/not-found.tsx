import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function AdminNotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-white/8 bg-[#141413] p-10 text-center">
      <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
        <FileQuestion className="h-6 w-6 text-white/40" />
      </span>
      <h1 className="text-xl font-semibold text-white">Screen not found</h1>
      <p className="mt-2 text-sm text-white/45">
        This admin screen doesn&apos;t exist, or the record you followed has been deleted.
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

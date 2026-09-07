"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Admin error boundary. Shows what actually went wrong instead of a bare
 * "something went wrong" — a CMS operator needs the real message (and the
 * digest that ties it to the server log) to report a fault usefully.
 * FORBIDDEN/UNAUTHENTICATED from requirePermission() get a plain-language
 * explanation rather than being presented as a crash.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin route error:", error);
  }, [error]);

  const isForbidden = error.message === "FORBIDDEN";
  const isUnauthenticated = error.message === "UNAUTHENTICATED";

  const title = isForbidden
    ? "Access denied"
    : isUnauthenticated
      ? "Your session has expired"
      : "This screen failed to load";

  const detail = isForbidden
    ? "Your role does not have permission to view this section."
    : isUnauthenticated
      ? "Sign in again to continue."
      : error.message;

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-white/8 bg-[#141413] p-10 text-center">
      <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
        <AlertTriangle className="h-6 w-6 text-red-400" />
      </span>
      <h1 className="text-xl font-semibold text-white">{title}</h1>
      <p className="mx-auto mt-2 max-w-lg break-words text-sm leading-relaxed text-white/50">{detail}</p>
      {error.digest && (
        <p className="mt-3 font-mono text-[11px] text-white/25">Reference: {error.digest}</p>
      )}

      <div className="mt-7 flex items-center justify-center gap-3">
        {!isForbidden && !isUnauthenticated && (
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-xs font-semibold text-ivory transition-colors hover:bg-gold-deep"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Try again
          </button>
        )}
        <Link
          href={isUnauthenticated ? "/admin/login" : "/admin"}
          className="inline-flex items-center rounded-xl border border-white/12 px-4 py-2 text-xs font-semibold text-white/75 transition-colors hover:border-gold hover:text-gold"
        >
          {isUnauthenticated ? "Go to sign in" : "Back to dashboard"}
        </Link>
      </div>
    </div>
  );
}

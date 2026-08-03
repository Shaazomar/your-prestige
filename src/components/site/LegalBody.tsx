import type { ReactNode } from "react";

/**
 * Typography wrapper for long-form legal copy.
 *
 * Tailwind's typography plugin isn't installed, so the prose rules live here
 * rather than pulling in a dependency for two pages.
 */
export function LegalBody({ children }: { children: ReactNode }) {
  return (
    <div
      className={[
        "max-w-none",
        "[&>p]:mb-6 [&>p]:text-[0.9375rem] [&>p]:leading-[1.8] [&>p]:text-muted",
        "[&>p.lead]:text-lead [&>p.lead]:mb-10",
        "[&>h2]:text-h4 [&>h2]:mb-4 [&>h2]:mt-14 [&>h2]:text-text first:[&>h2]:mt-0",
        "[&>ul]:mb-6 [&>ul]:space-y-3 [&>ul]:pl-5",
        "[&>ul>li]:list-disc [&>ul>li]:text-[0.9375rem] [&>ul>li]:leading-[1.8] [&>ul>li]:text-muted",
        "[&_strong]:font-medium [&_strong]:text-text",
        "[&_a]:text-gold [&_a]:underline [&_a]:underline-offset-4",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

import type { SVGProps } from "react";

/** Social brand marks — lucide removed brand icons, so these live here. */

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export function YoutubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}

export function ThreadsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.7 11.13c-.1-.05-.2-.09-.3-.13-.18-3.28-1.97-5.16-4.98-5.18h-.04c-1.8 0-3.3.77-4.22 2.17l1.42.97c.69-1.04 1.77-1.26 2.8-1.26h.03c1.1 0 1.94.32 2.48.95.4.46.66 1.09.79 1.89a14.4 14.4 0 0 0-2.2-.12c-2.9.17-4.77 1.86-4.64 4.21.06 1.19.66 2.22 1.68 2.89.86.57 1.97.85 3.12.79 1.52-.08 2.71-.66 3.54-1.72.63-.8 1.03-1.85 1.2-3.16.72.44 1.25 1.01 1.55 1.7.5 1.18.53 3.11-1.05 4.69-1.38 1.38-3.05 1.97-5.57 1.99-2.8-.02-4.91-.91-6.28-2.65C4.83 18.1 4.17 15.86 4.15 12c.02-3.86.68-6.1 1.98-7.75C7.5 2.51 9.61 1.62 12.41 1.6c2.82.02 4.94.91 6.32 2.66.68.85 1.19 1.93 1.53 3.19l1.66-.44c-.41-1.55-1.05-2.89-1.92-3.98C18.24.65 15.63-.48 12.42-.5h-.01C9.2-.48 6.62.65 4.94 2.86 3.44 4.82 2.67 7.55 2.65 12v.01c.02 4.44.79 7.17 2.29 9.13 1.68 2.2 4.27 3.34 7.47 3.36h.01c2.85-.02 4.86-.77 6.52-2.42 2.17-2.17 2.1-4.89 1.39-6.56-.51-1.2-1.48-2.17-2.79-2.79l-.84.4Zm-4.4 5.32c-1.27.07-2.6-.5-2.66-1.72-.05-.9.64-1.9 2.74-2.02.24-.02.47-.02.7-.02.76 0 1.48.07 2.13.21-.24 3.03-1.66 3.48-2.91 3.55Z" />
    </svg>
  );
}

export function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4V8h4v2a6 6 0 0 1 2-2z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

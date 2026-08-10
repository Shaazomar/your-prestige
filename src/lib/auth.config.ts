import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config — used by middleware.ts, which runs in the Edge
 * runtime and cannot load Prisma Client. No providers/DB access here;
 * the Credentials provider lives in auth.ts (Node runtime only).
 * Route-protection logic itself lives in middleware.ts for full control
 * over the redirect behavior (avoids the login-page-redirect-loop trap
 * of the `authorized` callback shorthand).
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [],
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "your@prestige-secret-key-fallback",
} satisfies NextAuthConfig;

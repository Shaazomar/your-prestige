import type { NextAuthConfig } from "next-auth";
import type { Role, UserStatus } from "@prisma/client";

/**
 * Edge-safe auth config — used by middleware.ts, which runs in the Edge
 * runtime and cannot load Prisma Client. No providers/DB access here;
 * the Credentials provider lives in auth.ts (Node runtime only).
 * Route-protection logic itself lives in middleware.ts for full control
 * over the redirect behavior (avoids the login-page-redirect-loop trap
 * of the `authorized` callback shorthand).
 *
 * The jwt/session callbacks live here rather than in auth.ts on purpose:
 * middleware builds its own NextAuth instance from this object alone, so
 * with the callbacks defined only in auth.ts the middleware's `req.auth.user`
 * carried no `role` at all and any role check there silently passed.
 */

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      status: UserStatus;
      name: string;
      email: string;
    };
  }
  interface User {
    id: string;
    role: Role;
    status: UserStatus;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    status: UserStatus;
  }
}

export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [],
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "your@prestige-secret-key-fallback",
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.status = token.status;
      return session;
    },
  },
} satisfies NextAuthConfig;

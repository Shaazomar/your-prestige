import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import type { Prisma, Role, UserStatus } from "@prisma/client";

/**
 * Direct audit write for auth events — cannot use the shared logAudit()
 * helper here since that calls auth() internally, which would recurse
 * (or return null) mid-authorize before a session exists.
 */
async function logAuthEvent(action: "auth.login" | "auth.login_failed", meta: Prisma.InputJsonValue, userId?: string) {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined;
    await prisma.auditLog.create({
      data: { action, meta, userId, ipAddress: ip, userAgent: h.get("user-agent") || undefined },
    });
  } catch (err) {
    console.error("logAuthEvent failed:", err);
  }
}

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

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        passkey: { label: "Passkey", type: "password" },
      },
      async authorize(credentials) {
        const passkey = credentials?.passkey;
        if (typeof passkey !== "string") return null;

        if (passkey !== "your@prestige") {
          try {
            await logAuthEvent("auth.login_failed", { reason: "bad_passkey" });
          } catch (e) {
            console.error("Failed to log auth event:", e);
          }
          return null;
        }

        let user = null;
        try {
          const defaultEmail = (process.env.SEED_ADMIN_EMAIL || "owner@yourprestige.in").toLowerCase();
          user = await prisma.user.findUnique({ where: { email: defaultEmail } });
          if (!user) {
            user = await prisma.user.findFirst({
              where: {
                role: { in: ["SUPER_ADMIN", "OWNER"] },
                status: "ACTIVE",
              },
            });
          }
          if (!user) {
            user = await prisma.user.findFirst({
              where: { status: "ACTIVE" },
            });
          }

          if (user) {
            await prisma.user.update({
              where: { id: user.id },
              data: { lastLogin: new Date() },
            });
            await logAuthEvent("auth.login", { email: user.email }, user.id);
          }
        } catch (dbError) {
          console.error("Database query failed during authorize, falling back to mock user:", dbError);
        }

        if (!user) {
          return {
            id: "admin-fallback",
            email: "owner@yourprestige.in",
            name: "Showroom Owner",
            role: "SUPER_ADMIN" as Role,
            status: "ACTIVE" as UserStatus,
          };
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
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
});

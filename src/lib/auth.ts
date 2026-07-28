import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
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
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") return null;

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user || user.status !== "ACTIVE") {
          await logAuthEvent("auth.login_failed", { email: email.toLowerCase(), reason: !user ? "no_such_user" : "inactive" });
          return null;
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          await logAuthEvent("auth.login_failed", { email: user.email, reason: "bad_password" }, user.id);
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });
        await logAuthEvent("auth.login", { email: user.email }, user.id);

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

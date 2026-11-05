import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import type { Prisma } from "@prisma/client";
import { createHash, timingSafeEqual } from "crypto";

/**
 * Constant-time string comparison. `!==` on a secret leaks its length and,
 * in principle, its prefix through timing. Both sides are hashed first so
 * the compared buffers are always the same length, which `timingSafeEqual`
 * requires (it throws on a length mismatch).
 */
function timingSafeEqualStr(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

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

        // The expected passkey was the literal string "your@prestige",
        // written into this file and committed to the repository — so the
        // whole admin surface (catalogue, orders, customer contact details,
        // CMS) was readable to anyone who could read the source, and to
        // anyone who guessed a phrase printed on the site's own masthead.
        // It now comes from the environment and there is no fallback: if
        // ADMIN_PASSKEY is unset, nobody signs in. That is the correct
        // failure mode for a missing auth secret — see docs/admin-auth.md
        // before deploying.
        const expected = process.env.ADMIN_PASSKEY;
        if (!expected) {
          console.error(
            "ADMIN_PASSKEY is not set — refusing every admin sign-in. Set it in the deployment environment."
          );
          await logAuthEvent("auth.login_failed", { reason: "admin_passkey_not_configured" });
          return null;
        }

        if (!timingSafeEqualStr(passkey, expected)) {
          try {
            await logAuthEvent("auth.login_failed", { reason: "bad_passkey" });
          } catch (e) {
            console.error("Failed to log auth event:", e);
          }
          return null;
        }

        // A database fault must not become a login. This used to fall through
        // to a hard-coded `admin-fallback` SUPER_ADMIN whenever the query
        // threw, so an outage handed full admin rights to anyone holding the
        // passkey — and every audit row it then wrote pointed at a user id
        // that does not exist. Fail closed instead.
        const defaultEmail = (process.env.SEED_ADMIN_EMAIL || "owner@yourprestige.in").toLowerCase();
        let user = await prisma.user.findUnique({ where: { email: defaultEmail } });
        if (!user) {
          user = await prisma.user.findFirst({
            where: {
              role: { in: ["SUPER_ADMIN", "MANAGER"] },
              status: "ACTIVE",
            },
          });
        }
        if (!user) {
          user = await prisma.user.findFirst({ where: { status: "ACTIVE" } });
        }

        if (!user) {
          await logAuthEvent("auth.login_failed", { reason: "no_active_admin_account" });
          return null;
        }

        // Deactivated and suspended accounts must not be able to sign in even
        // when they are the only account the lookup finds.
        if (user.status !== "ACTIVE") {
          await logAuthEvent("auth.login_failed", { reason: "inactive_account", email: user.email }, user.id);
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
});

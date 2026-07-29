import type { Role } from "@prisma/client";

/**
 * Pure, client-safe permission matrix — no server-only imports here.
 * Kept separate from rbac.ts's requirePermission() (which needs auth()
 * from @/lib/auth, a Node-only module) so client components like Sidebar
 * can import `can()` without pulling next/headers into the client bundle.
 */

export type Module =
  | "dashboard"
  | "homepage"
  | "products"
  | "catalogImports"
  | "landingPages"
  | "categories"
  | "brands"
  | "portfolio"
  | "showrooms"
  | "gallery"
  | "videos"
  | "testimonials"
  | "blog"
  | "faqs"
  | "offers"
  | "leads"
  | "bookings"
  | "conversations"
  | "media"
  | "seo"
  | "users"
  | "settings"
  | "maintenance"
  | "analytics"
  | "logs";

export type Action = "view" | "create" | "edit" | "delete" | "publish" | "settings" | "analytics";

const ALL_MODULES: Module[] = [
  "dashboard", "homepage", "products", "catalogImports", "landingPages",
  "categories", "brands", "portfolio",
  "showrooms", "gallery", "videos", "testimonials", "blog", "faqs", "offers", "leads",
  "bookings", "conversations", "media", "seo", "users", "settings",
  "maintenance", "analytics", "logs",
];

const ALL_ACTIONS: Action[] = ["view", "create", "edit", "delete", "publish", "settings", "analytics"];

const CONTENT_MODULES: Module[] = [
  "dashboard", "homepage", "products", "catalogImports", "landingPages",
  "categories", "brands", "portfolio",
  "showrooms", "gallery", "videos", "testimonials", "blog", "faqs", "offers", "media",
];

/**
 * Coarse-grained permission matrix keyed by the 7 seeded roles. This is a
 * pragmatic, code-defined matrix rather than a fully dynamic DB-backed
 * permission system — granular enough to gate every module/action pair the
 * spec asks for, without an extra Permission/RolePermission subsystem.
 */
const MATRIX: Record<Role, Partial<Record<Module, Action[]>>> = {
  SUPER_ADMIN: Object.fromEntries(ALL_MODULES.map((m) => [m, ALL_ACTIONS])),
  OWNER: Object.fromEntries(ALL_MODULES.map((m) => [m, ALL_ACTIONS])),
  MARKETING: {
    dashboard: ["view", "analytics"],
    homepage: ["view", "edit", "publish"],
    offers: ["view", "create", "edit", "delete", "publish"],
    leads: ["view", "create", "edit", "delete"],
    bookings: ["view", "create", "edit"],
    conversations: ["view", "delete"],
    testimonials: ["view", "create", "edit", "publish"],
    analytics: ["view", "analytics"],
    media: ["view", "create", "delete"],
  },
  CONTENT: Object.fromEntries(
    CONTENT_MODULES.map((m) => [m, ["view", "create", "edit", "delete", "publish"] as Action[]])
  ),
  SEO: {
    dashboard: ["view"],
    seo: ["view", "create", "edit", "delete", "publish"],
    // Local landing pages are pure SEO surface — this role owns them outright.
    landingPages: ["view", "create", "edit", "delete", "publish"],
    blog: ["view", "edit"],
    products: ["view", "edit"],
    // Read-only on imports: SEO reviews the copy that gets generated, but
    // running an import and publishing products is a content decision.
    catalogImports: ["view"],
    analytics: ["view", "analytics"],
  },
  SUPPORT: {
    dashboard: ["view"],
    leads: ["view", "create", "edit"],
    bookings: ["view", "create", "edit"],
    conversations: ["view"],
  },
  VIEWER: Object.fromEntries(ALL_MODULES.map((m) => [m, ["view"]])),
};

export function can(role: Role, module: Module, action: Action): boolean {
  return MATRIX[role]?.[module]?.includes(action) ?? false;
}

export function permissionsFor(role: Role): Partial<Record<Module, Action[]>> {
  return MATRIX[role] ?? {};
}

import { Prisma } from "@prisma/client";

/**
 * Sanitises the list parameters every admin table sends.
 *
 * `sortBy`, `page` and `pageSize` arrive from the browser and were spliced
 * straight into `orderBy: { [params.sortBy]: params.sortDir }` and `take:`.
 * A sortBy that isn't a real column makes Prisma throw (a 500 the operator
 * sees as a dead table), and an unbounded pageSize lets one request pull the
 * whole table. Both are validated here instead, in one place.
 */

const MAX_PAGE_SIZE = 100;

const scalarFieldCache = new Map<string, Set<string>>();

function scalarFieldsOf(model: string): Set<string> {
  const cached = scalarFieldCache.get(model);
  if (cached) return cached;
  const def = Prisma.dmmf.datamodel.models.find((m) => m.name === model);
  const fields = new Set(
    (def?.fields ?? [])
      .filter((f) => f.kind === "scalar" || f.kind === "enum")
      .map((f) => f.name)
  );
  scalarFieldCache.set(model, fields);
  return fields;
}

export function safeOrderBy(
  model: string,
  sortBy: string,
  sortDir: "asc" | "desc",
  fallbackField = "createdAt"
): Record<string, "asc" | "desc"> {
  const dir: "asc" | "desc" = sortDir === "asc" ? "asc" : "desc";
  const fields = scalarFieldsOf(model);
  if (sortBy && fields.has(sortBy)) return { [sortBy]: dir };
  if (fields.has(fallbackField)) return { [fallbackField]: dir };
  return { id: dir };
}

/** Clamps paging so one request can never ask for the entire table. */
export function safePaging(page: number, pageSize: number) {
  const size = Math.min(
    Math.max(Number.isFinite(pageSize) ? Math.trunc(pageSize) : 12, 1),
    MAX_PAGE_SIZE
  );
  const current = Math.max(Number.isFinite(page) ? Math.trunc(page) : 1, 1);
  return { skip: (current - 1) * size, take: size };
}

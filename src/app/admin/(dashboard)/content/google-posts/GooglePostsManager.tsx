"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, ExternalLink } from "lucide-react";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Drawer } from "@/components/admin/Drawer";
import { AField, ATextArea, ASelect, AToggle } from "@/components/admin/FormField";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { useAdminList } from "@/hooks/useAdminList";
import {
  listGooglePosts, createGooglePost, updateGooglePost,
  softDeleteGooglePost, restoreGooglePost, getShowroomOptions, type GooglePostRow,
} from "./actions";
import { googlePostSchema, type GooglePostInput } from "./schema";

const empty: GooglePostInput = {
  type: "UPDATE", title: "", body: "", image: "", ctaLabel: "", ctaUrl: "",
  startsAt: "", endsAt: "", sourceUrl: "", showroomId: "", published: true, sortOrder: 0,
};

const TYPE_STYLES: Record<string, string> = {
  UPDATE: "bg-sky-400/15 text-sky-300",
  OFFER: "bg-gold/15 text-gold",
  EVENT: "bg-violet-400/15 text-violet-300",
};

/** Date input needs yyyy-MM-dd; a Date renders as an ISO string otherwise. */
const dateValue = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");

export function GooglePostsManager({
  permissions,
}: {
  permissions: { create: boolean; edit: boolean; delete: boolean };
}) {
  const list = useAdminList<GooglePostRow>(listGooglePosts, {
    initialSortBy: "createdAt",
    initialSortDir: "desc",
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GooglePostRow | null>(null);
  const [deleting, setDeleting] = useState<GooglePostRow | null>(null);
  const [values, setValues] = useState<GooglePostInput>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showrooms, setShowrooms] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getShowroomOptions().then(setShowrooms).catch(() => {});
  }, []);

  useEffect(() => {
    if (!editing) return setValues(empty);
    setValues({
      type: editing.type as GooglePostInput["type"],
      title: editing.title,
      body: editing.body ?? "",
      image: editing.image ?? "",
      ctaLabel: editing.ctaLabel ?? "",
      ctaUrl: editing.ctaUrl ?? "",
      startsAt: dateValue(editing.startsAt),
      endsAt: dateValue(editing.endsAt),
      sourceUrl: editing.sourceUrl ?? "",
      showroomId: editing.showroomId ?? "",
      published: editing.published,
      sortOrder: editing.sortOrder,
    });
    setErrors({});
  }, [editing]);

  const set = <K extends keyof GooglePostInput>(k: K, v: GooglePostInput[K]) =>
    setValues((s) => ({ ...s, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = googlePostSchema.safeParse(values);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const i of parsed.error.issues) fe[i.path[0] as string] = i.message;
      setErrors(fe);
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSaving(true);
    try {
      if (editing) await updateGooglePost(editing.id, parsed.data);
      else await createGooglePost(parsed.data);
      toast.success(editing ? "Post saved" : "Post created");
      setOpen(false);
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await softDeleteGooglePost(deleting.id);
      toast.success("Post moved to trash");
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  async function handleRestore(row: GooglePostRow) {
    try {
      await restoreGooglePost(row.id);
      toast.success("Post restored");
      list.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Restore failed");
    }
  }

  const columns: Column<GooglePostRow>[] = [
    {
      key: "title",
      label: "Post",
      sortable: true,
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{row.title}</p>
          {row.body && <p className="truncate text-xs text-white/35">{row.body}</p>}
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (row) => (
        <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ${TYPE_STYLES[row.type] ?? TYPE_STYLES.UPDATE}`}>
          {row.type}
        </span>
      ),
    },
    {
      key: "startsAt",
      label: "Runs",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-white/40">
          {row.startsAt ? new Date(row.startsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
          {row.endsAt ? ` → ${new Date(row.endsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}
        </span>
      ),
    },
    {
      key: "sourceUrl",
      label: "",
      render: (row) =>
        row.sourceUrl ? (
          <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-gold hover:underline">
            On Google <ExternalLink className="h-3 w-3" />
          </a>
        ) : null,
    },
  ];

  return (
    <>
      <AdminDataTable
        columns={columns}
        rows={list.rows}
        total={list.total}
        page={list.page}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
        search={list.search}
        onSearchChange={list.setSearch}
        sortBy={list.sortBy}
        sortDir={list.sortDir}
        onSort={list.toggleSort}
        loading={list.loading}
        initialLoad={list.initialLoad}
        getId={(row) => row.id}
        trash={list.trash}
        onTrashToggle={list.setTrash}
        onEdit={permissions.edit ? (row) => { setEditing(row); setOpen(true); } : undefined}
        onDelete={permissions.delete ? setDeleting : undefined}
        onRestore={permissions.edit ? handleRestore : undefined}
        searchPlaceholder="Search posts…"
        emptyMessage="No Google Business posts yet."
        toolbar={
          permissions.create ? (
            <button
              onClick={() => { setEditing(null); setOpen(true); }}
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-gold-deep"
            >
              <Plus className="h-4 w-4" /> New Post
            </button>
          ) : undefined
        }
      />

      <Drawer
        open={open}
        title={editing ? "Edit post" : "New Google Business post"}
        description="Mirrored into the CMS so the same update can render on the site."
        onClose={() => setOpen(false)}
        wide
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <ASelect label="Type" value={values.type} onChange={(e) => set("type", e.target.value as GooglePostInput["type"])}>
            <option value="UPDATE">Update</option>
            <option value="OFFER">Offer</option>
            <option value="EVENT">Event</option>
          </ASelect>
          <AField label="Title" required value={values.title} error={errors.title} onChange={(e) => set("title", e.target.value)} />
          <ATextArea label="Body" rows={4} value={values.body ?? ""} onChange={(e) => set("body", e.target.value)} />
          <ImageUploadField label="Image" value={values.image || null} onChange={(url) => set("image", url ?? "")} />

          <div className="grid gap-4 sm:grid-cols-2">
            <AField label="CTA label" value={values.ctaLabel ?? ""} onChange={(e) => set("ctaLabel", e.target.value)} />
            <AField label="CTA link" value={values.ctaUrl ?? ""} onChange={(e) => set("ctaUrl", e.target.value)} />
            <AField label="Starts" type="date" value={values.startsAt ?? ""} onChange={(e) => set("startsAt", e.target.value)} />
            <AField label="Ends" type="date" value={values.endsAt ?? ""} onChange={(e) => set("endsAt", e.target.value)} />
          </div>

          <ASelect label="Showroom" value={values.showroomId ?? ""} onChange={(e) => set("showroomId", e.target.value)} hint="Leave blank to apply to all branches">
            <option value="">All showrooms</option>
            {showrooms.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </ASelect>

          <AField label="Link to the live Google post" value={values.sourceUrl ?? ""} onChange={(e) => set("sourceUrl", e.target.value)} />
          <AToggle label="Published" checked={values.published} onChange={(v) => set("published", v)} />

          <div className="flex gap-3 border-t border-white/8 pt-6">
            <button type="submit" disabled={saving} className="rounded-lg bg-gold px-5 py-2.5 text-sm font-medium text-ink hover:bg-gold-deep disabled:opacity-60">
              {saving ? "Saving…" : editing ? "Save Changes" : "Create Post"}
            </button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!deleting}
        title="Move post to trash?"
        description={`"${deleting?.title}" will stop showing on the site. The post on Google itself is unaffected.`}
        confirmLabel="Move to Trash"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}

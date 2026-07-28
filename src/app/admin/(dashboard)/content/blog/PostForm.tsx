"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AField, ATextArea, ASelect, ATagInput } from "@/components/admin/FormField";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { postSchema, type PostInput } from "./schema";
import { createPost, updatePost } from "./actions";
import type { PostRow } from "./actions";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

const empty: PostInput = { title: "", slug: "", excerpt: "", content: "", coverImage: "", category: "", tags: [], status: "draft", scheduledAt: "" };

export function PostForm({ post, onSuccess }: { post: PostRow | null; onSuccess: () => void }) {
  const [values, setValues] = useState<PostInput>(
    post
      ? {
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? "",
          content: post.content,
          coverImage: post.coverImage ?? "",
          category: post.category ?? "",
          tags: (post.tags as string[]) ?? [],
          status: post.status,
          scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : "",
        }
      : empty
  );
  const [slugTouched, setSlugTouched] = useState(!!post);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = postSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (post) {
        await updatePost(post.id, parsed.data);
        toast.success("Post updated");
      } else {
        await createPost(parsed.data);
        toast.success("Post created");
      }
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AField
        label="Title" required
        value={values.title}
        onChange={(e) => { const title = e.target.value; setValues((v) => ({ ...v, title, slug: slugTouched ? v.slug : slugify(title) })); }}
        error={errors.title}
      />
      <AField label="Slug" required value={values.slug} onChange={(e) => { setSlugTouched(true); setValues((v) => ({ ...v, slug: e.target.value })); }} error={errors.slug} />
      <ATextArea label="Excerpt" value={values.excerpt} onChange={(e) => setValues((v) => ({ ...v, excerpt: e.target.value }))} />
      <ATextArea label="Content (Markdown)" required value={values.content} onChange={(e) => setValues((v) => ({ ...v, content: e.target.value }))} error={errors.content} className="min-h-64 font-mono text-xs" />
      <ImageUploadField label="Cover Image" value={values.coverImage || null} onChange={(url) => setValues((v) => ({ ...v, coverImage: url ?? "" }))} />
      <div className="grid grid-cols-2 gap-4">
        <AField label="Category" value={values.category} onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))} />
        <ASelect label="Status" value={values.status} onChange={(e) => setValues((v) => ({ ...v, status: e.target.value as PostInput["status"] }))}>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
        </ASelect>
      </div>
      {values.status === "scheduled" && (
        <AField label="Publish At" type="datetime-local" value={values.scheduledAt} onChange={(e) => setValues((v) => ({ ...v, scheduledAt: e.target.value }))} />
      )}
      <ATagInput label="Tags" value={values.tags} onChange={(tags) => setValues((v) => ({ ...v, tags }))} />
      <button type="submit" disabled={saving} className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep disabled:opacity-60">
        {saving ? "Saving…" : post ? "Save Changes" : "Create Post"}
      </button>
    </form>
  );
}

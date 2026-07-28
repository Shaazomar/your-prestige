"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AField, ATextArea, ASelect, AToggle } from "@/components/admin/FormField";
import { MultiImageField } from "@/components/admin/MultiImageField";
import { projectSchema, type ProjectInput } from "./schema";
import { createProject, updateProject } from "./actions";
import type { ProjectRow } from "./actions";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

const empty: ProjectInput = {
  title: "", slug: "", type: "Villa", client: "", builder: "", architect: "",
  location: "", year: "", completionDate: "", description: "", images: [],
  video: "", featured: false, published: true,
};

export function ProjectForm({ project, onSuccess }: { project: ProjectRow | null; onSuccess: () => void }) {
  const [values, setValues] = useState<ProjectInput>(
    project
      ? {
          title: project.title,
          slug: project.slug,
          type: project.type as ProjectInput["type"],
          client: project.client ?? "",
          builder: project.builder ?? "",
          architect: project.architect ?? "",
          location: project.location ?? "",
          year: project.year ?? "",
          completionDate: project.completionDate ? project.completionDate.toISOString().split("T")[0] : "",
          description: project.description ?? "",
          images: (project.images as string[]) ?? [],
          video: project.video ?? "",
          featured: project.featured,
          published: project.published,
        }
      : empty
  );
  const [slugTouched, setSlugTouched] = useState(!!project);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = projectSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (project) {
        await updateProject(project.id, parsed.data);
        toast.success("Project updated");
      } else {
        await createProject(parsed.data);
        toast.success("Project created");
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
      <ASelect label="Type" required value={values.type} onChange={(e) => setValues((v) => ({ ...v, type: e.target.value as ProjectInput["type"] }))}>
        <option value="Villa">Villa</option>
        <option value="Apartment">Apartment</option>
        <option value="Hotel">Hotel</option>
        <option value="Commercial">Commercial</option>
        <option value="Residential">Residential</option>
      </ASelect>
      <div className="grid grid-cols-2 gap-4">
        <AField label="Client" value={values.client} onChange={(e) => setValues((v) => ({ ...v, client: e.target.value }))} />
        <AField label="Builder" value={values.builder} onChange={(e) => setValues((v) => ({ ...v, builder: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <AField label="Architect" value={values.architect} onChange={(e) => setValues((v) => ({ ...v, architect: e.target.value }))} />
        <AField label="Location" value={values.location} onChange={(e) => setValues((v) => ({ ...v, location: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <AField label="Year" value={values.year} onChange={(e) => setValues((v) => ({ ...v, year: e.target.value }))} placeholder="2025" />
        <AField label="Completion Date" type="date" value={values.completionDate} onChange={(e) => setValues((v) => ({ ...v, completionDate: e.target.value }))} />
      </div>
      <ATextArea label="Description" value={values.description} onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))} />
      <MultiImageField label="Gallery" value={values.images} onChange={(images) => setValues((v) => ({ ...v, images }))} />
      <AField label="Video URL" value={values.video} onChange={(e) => setValues((v) => ({ ...v, video: e.target.value }))} />
      <AToggle label="Featured" checked={values.featured} onChange={(featured) => setValues((v) => ({ ...v, featured }))} />
      <AToggle label="Published" checked={values.published} onChange={(published) => setValues((v) => ({ ...v, published }))} />
      <button type="submit" disabled={saving} className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-ivory transition-colors hover:bg-gold-deep disabled:opacity-60">
        {saving ? "Saving…" : project ? "Save Changes" : "Create Project"}
      </button>
    </form>
  );
}

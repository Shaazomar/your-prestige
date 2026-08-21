"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { X, Upload, Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
import { createAboutPerson, updateAboutPerson, type AboutPersonInput } from "./actions";
import type { AboutPerson } from "@prisma/client";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  person?: AboutPerson | null;
  onSuccess: () => void;
}

const PERSON_TYPES = [
  { value: "Inauguration", label: "Inauguration Dignitary" },
  { value: "Management", label: "Management / MD" },
  { value: "Official", label: "Government / Police Official" },
  { value: "Director", label: "Board Director" },
  { value: "Founder", label: "Founder / Leadership" },
  { value: "Guest", label: "Chief Guest / VIP" },
];

export function PersonFormDrawer({ open, onClose, person, onSuccess }: DrawerProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<AboutPersonInput>({
    name: "",
    designation: "",
    description: "",
    eyebrow: "DISTINGUISHED GUEST",
    image: "",
    imageKey: "",
    imageAlt: "",
    type: "Inauguration",
    date: "",
    location: "",
    displayOrder: 0,
    active: true,
  });

  useEffect(() => {
    if (person) {
      setFormData({
        name: person.name || "",
        designation: person.designation || "",
        description: person.description || "",
        eyebrow: person.eyebrow || (person.type === "Inauguration" ? "DISTINGUISHED GUEST" : ""),
        image: person.image || "",
        imageKey: person.imageKey || "",
        imageAlt: person.imageAlt || "",
        type: person.type || "Inauguration",
        date: person.date || "",
        location: person.location || "",
        displayOrder: person.displayOrder ?? 0,
        active: person.active ?? true,
      });
    } else {
      setFormData({
        name: "",
        designation: "",
        description: "",
        eyebrow: "DISTINGUISHED GUEST",
        image: "",
        imageKey: "",
        imageAlt: "",
        type: "Inauguration",
        date: "",
        location: "",
        displayOrder: 0,
        active: true,
      });
    }
  }, [person, open]);

  if (!open) return null;

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (JPEG, PNG, WebP)");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("Image file size should be less than 15MB");
      return;
    }

    setUploading(true);
    toast.loading("Uploading image to Amazon S3...", { id: "s3-upload" });

    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/admin/s3-upload", {
        method: "POST",
        body: data,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Upload failed");
      }

      const { url, key } = await res.json();
      setFormData((prev) => ({
        ...prev,
        image: url,
        imageKey: key,
        imageAlt: prev.imageAlt || `${prev.name || "Inauguration"} - ${prev.designation || ""}`,
      }));

      toast.success("Image uploaded to Amazon S3 successfully!", { id: "s3-upload" });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to upload image", { id: "s3-upload" });
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter a name");
      return;
    }

    if (!formData.image.trim()) {
      toast.error("Please upload an image for this person");
      return;
    }

    setLoading(true);
    try {
      if (person?.id) {
        await updateAboutPerson(person.id, formData);
        toast.success("Person updated successfully");
      } else {
        await createAboutPerson(formData);
        toast.success("Person created successfully");
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to save record");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-2xl bg-[#141413] text-white shadow-2xl border-l border-white/10 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {person ? "Edit Person / Guest" : "Add Person / Guest"}
              </h2>
              <p className="text-xs text-white/50">
                Manage inauguration dignitaries, leadership, and VIP guests for the About page.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Type input with datalist suggestions */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Category / Person Type *
              </label>
              <input
                type="text"
                list="person-types"
                required
                placeholder="e.g. Inauguration, Management, Director, Guest"
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value,
                    eyebrow:
                      e.target.value === "Inauguration"
                        ? "DISTINGUISHED GUEST"
                        : prev.eyebrow,
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-gold focus:outline-none"
              />
              <datalist id="person-types">
                {PERSON_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </datalist>
            </div>

            {/* Name & Designation */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/60">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. U. T. Khader"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-gold focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/60">
                  Official Designation *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hon'ble Speaker of the Karnataka Legislative Assembly"
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, designation: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-gold focus:outline-none"
                />
              </div>
            </div>

            {/* Eyebrow & Alt text */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/60">
                  Eyebrow Heading
                </label>
                <input
                  type="text"
                  placeholder="e.g. INAUGURATED BY"
                  value={formData.eyebrow || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, eyebrow: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-gold focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/60">
                  Image Alt Text (SEO & Accessibility)
                </label>
                <input
                  type="text"
                  placeholder="e.g. U. T. Khader inaugurating Prestige Tiles"
                  value={formData.imageAlt || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, imageAlt: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-gold focus:outline-none"
                />
              </div>
            </div>

            {/* Image upload area */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Person / Inauguration Image (Amazon S3) *
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-center">
                {formData.image ? (
                  <div className="space-y-3">
                    <div className="relative mx-auto h-44 w-36 overflow-hidden rounded-xl border border-white/10 shadow-lg">
                      <Image
                        src={formData.image}
                        alt={formData.imageAlt || formData.name || "Preview"}
                        fill
                        className="object-cover"
                        unoptimized={formData.image.startsWith("/uploads")}
                      />
                    </div>
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 rounded-lg bg-gold/15 px-3 py-1.5 text-xs font-semibold text-gold hover:bg-gold/25"
                      >
                        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        Replace Image (S3)
                      </button>
                    </div>
                    <p className="truncate text-[0.65rem] text-white/40">{formData.image}</p>
                  </div>
                ) : (
                  <div className="py-6 space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-gold">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Upload Photograph</p>
                      <p className="text-xs text-white/40">Stored directly in Amazon S3 bucket</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-xs font-bold text-ink hover:bg-gold-light"
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Select Image File
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Supporting Description / Narrative
              </label>
              <textarea
                rows={3}
                placeholder="Optional detailed description..."
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-gold focus:outline-none"
              />
            </div>

            {/* Active & Display order */}
            <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
              <div>
                <p className="text-sm font-medium text-white">Publish on Public About Page</p>
                <p className="text-xs text-white/40">Controls whether this record appears live on the website</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, active: !prev.active }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.active ? "bg-gold" : "bg-white/10"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${
                    formData.active ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Live Editorial Card Preview */}
            <div className="rounded-2xl border border-white/10 bg-[#1a1a19] p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold">
                <Sparkles className="h-3.5 w-3.5" />
                Live Frontend Editorial Preview
              </div>
              <div className="rounded-xl bg-[#0d0d0c] p-4 text-white flex gap-4 items-center">
                {formData.image && (
                  <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-black">
                    <Image
                      src={formData.image}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <div>
                  <h4 className="text-base font-bold text-white">
                    {formData.name || "Person Name"}
                  </h4>
                  <p className="text-xs font-medium text-white/70">
                    {formData.designation || "Designation"}
                  </p>
                </div>
              </div>
            </div>

            {/* Submit buttons */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || uploading}
                className="flex items-center gap-2 rounded-xl bg-gold px-6 py-2.5 text-sm font-bold text-ink hover:bg-gold-light disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {person ? "Update Record" : "Save Record"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

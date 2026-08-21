"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Plus, Search, ArrowUp, ArrowDown, Trash2, Edit3, Eye, EyeOff, Sparkles, CheckCircle2, XCircle
} from "lucide-react";
import {
  listAboutPeople,
  toggleActiveAboutPerson,
  deleteAboutPerson,
  reorderAboutPeople,
} from "./actions";
import { PersonFormDrawer } from "./PersonFormDrawer";
import type { AboutPerson } from "@prisma/client";

interface PeopleManagerProps {
  permissions: {
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
}

export function PeopleManager({ permissions }: PeopleManagerProps) {
  const [people, setPeople] = useState<AboutPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [editingPerson, setEditingPerson] = useState<AboutPerson | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [, startTransition] = useTransition();

  const fetchList = useCallback(() => {
    setLoading(true);
    listAboutPeople({ search, type: selectedType })
      .then(setPeople)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [search, selectedType]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  function handleCreateNew() {
    setEditingPerson(null);
    setDrawerOpen(true);
  }

  function handleEdit(person: AboutPerson) {
    setEditingPerson(person);
    setDrawerOpen(true);
  }

  function handleToggleActive(person: AboutPerson) {
    startTransition(async () => {
      try {
        await toggleActiveAboutPerson(person.id);
        toast.success(`Status updated for "${person.name}"`);
        fetchList();
      } catch {
        toast.error("Failed to toggle status");
      }
    });
  }

  function handleDelete(person: AboutPerson) {
    if (!confirm(`Are you sure you want to delete "${person.name}"?`)) return;

    startTransition(async () => {
      try {
        await deleteAboutPerson(person.id);
        toast.success(`Deleted "${person.name}"`);
        fetchList();
      } catch {
        toast.error("Failed to delete record");
      }
    });
  }

  function handleReorder(person: AboutPerson, direction: "up" | "down") {
    startTransition(async () => {
      try {
        await reorderAboutPeople(person.id, direction);
        fetchList();
      } catch {
        toast.error("Failed to reorder");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">About Page — People & Inauguration</h1>
            <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-xs font-semibold text-gold border border-gold/20">
              CMS Dynamic
            </span>
          </div>
          <p className="mt-1 text-sm text-white/50">
            Manage inauguration dignitaries, leadership team, government officials, and VIP guests shown on the About page.
          </p>
        </div>

        {permissions.create && (
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-ink hover:bg-gold-light transition-all shadow-lg shadow-gold/10"
          >
            <Plus className="h-4 w-4" />
            Add Person / Guest
          </button>
        )}
      </div>

      {/* Filter and Search bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-white/5 p-4 border border-white/10">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search by name, designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-gold focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-white/40">Category:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#1a1a19] px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="Inauguration">Inauguration</option>
            <option value="Management">Management</option>
            <option value="Official">Government/Official</option>
            <option value="Director">Director</option>
            <option value="Founder">Founder</option>
            <option value="Guest">Guest</option>
          </select>
        </div>
      </div>

      {/* Table / Grid */}
      {loading ? (
        <div className="py-16 text-center text-white/40">Loading records...</div>
      ) : people.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-gold/40 mb-3" />
          <h3 className="text-lg font-semibold text-white">No entries found</h3>
          <p className="text-sm text-white/40 mt-1">Add your first inauguration dignitary or person to feature on the About page.</p>
          {permissions.create && (
            <button
              onClick={handleCreateNew}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-xs font-bold text-ink hover:bg-gold-light"
            >
              <Plus className="h-4 w-4" /> Add Person
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((person, index) => (
            <div
              key={person.id}
              className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                person.active
                  ? "border-white/10 bg-white/5 hover:border-gold/30 hover:bg-white/[0.07]"
                  : "border-white/5 bg-white/[0.02] opacity-60"
              }`}
            >
              {/* Top status bar */}
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 text-xs">
                <span className="rounded-full bg-gold/15 px-2 py-0.5 font-semibold text-gold">
                  {person.type}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 font-medium ${
                      person.active ? "text-emerald-400" : "text-white/30"
                    }`}
                  >
                    {person.active ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    {person.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 flex gap-4">
                <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black">
                  <Image
                    src={person.image}
                    alt={person.imageAlt || person.name}
                    fill
                    className="object-cover"
                    unoptimized={person.image.startsWith("/uploads")}
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  {person.eyebrow && (
                    <p className="text-[0.65rem] uppercase tracking-widest font-semibold text-gold">
                      {person.eyebrow}
                    </p>
                  )}
                  <h3 className="truncate text-base font-bold text-white group-hover:text-gold transition-colors">
                    {person.name}
                  </h3>
                  <p className="text-xs font-medium text-white/70 line-clamp-2">
                    {person.designation}
                  </p>
                  {person.description && (
                    <p className="text-[0.75rem] text-white/40 line-clamp-2 pt-1">
                      {person.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between border-t border-white/10 bg-black/20 px-3 py-2">
                <div className="flex items-center gap-1">
                  {permissions.edit && (
                    <>
                      <button
                        onClick={() => handleReorder(person, "up")}
                        disabled={index === 0}
                        title="Move Up"
                        className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-20"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleReorder(person, "down")}
                        disabled={index === people.length - 1}
                        title="Move Down"
                        className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-20"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {permissions.edit && (
                    <button
                      onClick={() => handleToggleActive(person)}
                      title={person.active ? "Deactivate" : "Activate"}
                      className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
                    >
                      {person.active ? <Eye className="h-4 w-4 text-emerald-400" /> : <EyeOff className="h-4 w-4 text-white/30" />}
                    </button>
                  )}

                  {permissions.edit && (
                    <button
                      onClick={() => handleEdit(person)}
                      title="Edit"
                      className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
                    >
                      <Edit3 className="h-4 w-4 text-gold" />
                    </button>
                  )}

                  {permissions.delete && (
                    <button
                      onClick={() => handleDelete(person)}
                      title="Delete"
                      className="rounded-lg p-1.5 text-white/50 hover:bg-red-500/20 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer Form */}
      <PersonFormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        person={editingPerson}
        onSuccess={fetchList}
      />
    </div>
  );
}

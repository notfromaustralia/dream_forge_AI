"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Copy,
  Download,
  MoreVertical,
  Network,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { DeleteUniverseDialog } from "@/components/universe/DeleteUniverseDialog";
import { api } from "@/lib/api";
import { toast } from "sonner";

type DialogMode = "rename" | "synopsis" | null;

export function UniverseActionsMenu({
  universeId,
  universeName,
  overview = "",
  redirectTo = "/dashboard",
  triggerClassName,
}: {
  universeId: string;
  universeName: string;
  overview?: string;
  redirectTo?: string;
  triggerClassName?: string;
}) {
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState(universeName);
  const [synopsis, setSynopsis] = useState(overview);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["universe", universeId] });
    queryClient.invalidateQueries({ queryKey: ["universes"] });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body =
        dialog === "rename"
          ? { name: name.trim() }
          : { overview: synopsis.trim() };
      if (dialog === "rename" && !name.trim()) {
        toast.error("Name cannot be empty");
        return;
      }
      await api.updateUniverse(universeId, body);
      invalidate();
      toast.success(dialog === "rename" ? "Universe renamed" : "Synopsis updated");
      setDialog(null);
      if (dialog === "rename") router.refresh();
    } catch {
      toast.error("Could not save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const [universe, context] = await Promise.all([
        api.getUniverse(universeId),
        api.getWorldContext(universeId),
      ]);
      const payload = {
        exported_at: new Date().toISOString(),
        universe,
        world_context: context,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${universeName.replace(/\s+/g, "-").toLowerCase()}-export.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("World data exported");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/universe/${universeId}/overview`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const openEdit = (mode: DialogMode) => {
    setName(universeName);
    setSynopsis(overview);
    setDialog(mode);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={triggerClassName ?? "shrink-0 border-white/10"}
            aria-label="Universe actions"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Universe</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/universe/${universeId}/overview#forge-more`}>
              <Sparkles className="h-4 w-4 text-violet-400" />
              Forge more lore
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/universe/${universeId}/graph`}>
              <Network className="h-4 w-4 text-cyan-400" />
              Knowledge graph
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/universe/${universeId}/timeline`}>
              <Clock className="h-4 w-4 text-amber-400" />
              Time machine
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Manage</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => openEdit("rename")}>
            <Pencil className="h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => openEdit("synopsis")}>
            <Pencil className="h-4 w-4" />
            Edit synopsis
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleExport} disabled={exporting}>
            <Download className="h-4 w-4" />
            {exporting ? "Exporting..." : "Export world data"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleCopyLink}>
            <Copy className="h-4 w-4" />
            Copy share link
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-300 focus:bg-red-500/10 focus:text-red-200"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete universe
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteUniverseDialog
        universeId={universeId}
        universeName={universeName}
        redirectTo={redirectTo}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />

      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <h3 className="font-[family-name:var(--font-cinzel)] text-xl font-bold text-white">
              {dialog === "rename" ? "Rename Universe" : "Edit Synopsis"}
            </h3>
            <p className="mt-2 text-sm text-white/60">
              {dialog === "rename"
                ? "Give your world a new title."
                : "Update the overview shown on your universe dashboard."}
            </p>
            <div className="mt-4">
              {dialog === "rename" ? (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Universe name"
                  className="border-white/10 bg-white/5"
                  autoFocus
                />
              ) : (
                <textarea
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  rows={5}
                  placeholder="World synopsis..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  autoFocus
                />
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialog(null)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

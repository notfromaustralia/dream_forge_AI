"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function DeleteUniverseDialog({
  universeId,
  universeName,
  redirectTo = "/dashboard",
  trigger,
}: {
  universeId: string;
  universeName: string;
  redirectTo?: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteUniverse(universeId);
      queryClient.invalidateQueries({ queryKey: ["universes"] });
      toast.success("Universe deleted");
      router.push(redirectTo);
    } catch {
      toast.error("Failed to delete universe");
    } finally {
      setDeleting(false);
      setOpen(false);
    }
  };

  return (
    <>
      <div onClick={() => setOpen(true)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setOpen(true)}>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-1 border-red-500/30 text-red-300 hover:bg-red-500/10">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        )}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <h3 className="font-[family-name:var(--font-cinzel)] text-xl font-bold text-white">Delete Universe?</h3>
            <p className="mt-2 text-sm text-white/60">
              This will permanently erase <strong className="text-white">{universeName}</strong> and all its characters,
              factions, stories, and timeline. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Forever"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

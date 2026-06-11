"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Globe, MapPin, MoreVertical, Swords, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteUniverseDialog } from "@/components/universe/DeleteUniverseDialog";
import { PollinationsImage } from "@/components/ui/PollinationsImage";
import type { Universe } from "@/lib/api";
import { pollinationsBannerUrl, universeBannerPrompt } from "@/lib/visual-prompts";

export function UniverseCard({ universe, index }: { universe: Universe; index: number }) {
  const counts = universe.entity_counts;
  const bannerSrc = pollinationsBannerUrl(universeBannerPrompt(universe), universe.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="group relative"
    >
      <Link href={`/universe/${universe.id}/overview`}>
        <Card className="overflow-hidden cursor-pointer transition-all hover:border-violet-500/30 hover:shadow-violet-500/10 hover:shadow-2xl">
          <div className="relative h-28">
            <PollinationsImage
              src={bannerSrc}
              alt=""
              className="h-full"
              fallbackClassName="h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
          </div>
          <CardHeader className="relative -mt-4">
            <div className="flex items-start justify-between">
              <CardTitle className="group-hover:text-violet-300 transition-colors">
                {universe.name}
              </CardTitle>
              <Badge variant="secondary">{universe.genre}</Badge>
            </div>
            <CardDescription className="line-clamp-2">{universe.overview || universe.prompt}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 text-xs text-white/50">
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{counts?.characters ?? 0}</span>
              <span className="flex items-center gap-1"><Swords className="h-3 w-3" />{counts?.factions ?? 0}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{counts?.locations ?? 0}</span>
              <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{counts?.events ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </Link>
      <div className="absolute right-3 top-3 z-10" onClick={(e) => e.preventDefault()}>
        <DeleteUniverseDialog
          universeId={universe.id}
          universeName={universe.name}
          trigger={
            <Button variant="outline" size="icon" className="h-8 w-8 border-white/20 bg-slate-950/80 backdrop-blur">
              <MoreVertical className="h-4 w-4" />
            </Button>
          }
        />
      </div>
    </motion.div>
  );
}

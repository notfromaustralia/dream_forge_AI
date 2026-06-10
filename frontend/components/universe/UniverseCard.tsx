"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Globe, Users, Swords, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Universe } from "@/lib/api";

export function UniverseCard({ universe, index }: { universe: Universe; index: number }) {
  const counts = universe.entity_counts;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <Link href={`/universe/${universe.id}/overview`}>
        <Card className="group cursor-pointer transition-all hover:border-violet-500/30 hover:shadow-violet-500/10 hover:shadow-2xl">
          <CardHeader>
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
            <div className="mt-3 flex gap-2">
              <Badge variant="outline">C: {Math.round(universe.consistency_score)}</Badge>
              <Badge variant="outline">Cr: {Math.round(universe.creativity_score)}</Badge>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

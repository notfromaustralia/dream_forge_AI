"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { api, type GraphData } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

const NODE_COLORS: Record<string, string> = {
  character: "#8b5cf6",
  faction: "#06b6d4",
  location: "#10b981",
  event: "#f59e0b",
  story: "#ec4899",
};

function layoutGraph(data: GraphData): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 80, ranksep: 100 });

  data.nodes.forEach((n) => g.setNode(n.id, { width: 160, height: 50 }));
  data.edges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  const nodes: Node[] = data.nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      id: n.id,
      type: "default",
      position: { x: pos?.x ?? 0, y: pos?.y ?? 0 },
      data: { label: n.label },
      style: {
        background: NODE_COLORS[n.type] ?? "#6366f1",
        color: "white",
        border: "2px solid rgba(255,255,255,0.2)",
        borderRadius: n.type === "faction" ? "4px" : "50px",
        padding: "8px 16px",
        fontSize: 12,
        fontWeight: 600,
        width: 160,
      },
    };
  });

  const edges: Edge[] = data.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: e.strength > 0.7,
    style: { stroke: "rgba(139,92,246,0.6)", strokeWidth: 1 + e.strength * 2 },
    labelStyle: { fill: "rgba(255,255,255,0.7)", fontSize: 10 },
  }));

  return { nodes, edges };
}

export function UniverseGraph({ universeId, eraYear }: { universeId: string; eraYear?: number }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [filters, setFilters] = useState<Set<string>>(new Set(["character", "faction", "location", "event", "story"]));
  const [selected, setSelected] = useState<Node | null>(null);
  const [raw, setRaw] = useState<GraphData | null>(null);

  const load = useCallback(async () => {
    const data = await api.getGraph(universeId, eraYear);
    setRaw(data);
    const filtered: GraphData = {
      nodes: data.nodes.filter((n) => filters.has(n.type)),
      edges: data.edges.filter(
        (e) =>
          data.nodes.find((n) => n.id === e.source && filters.has(n.type)) &&
          data.nodes.find((n) => n.id === e.target && filters.has(n.type))
      ),
    };
    const laid = layoutGraph(filtered);
    setNodes(laid.nodes);
    setEdges(laid.edges);
  }, [universeId, eraYear, filters, setNodes, setEdges]);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  const toggleFilter = (type: string) => {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const stats = useMemo(() => {
    if (!raw) return null;
    const counts: Record<string, number> = {};
    raw.nodes.forEach((n) => { counts[n.type] = (counts[n.type] ?? 0) + 1; });
    return counts;
  }, [raw]);

  return (
    <div className="h-[600px] w-full rounded-2xl border border-white/10 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => setSelected(node)}
        fitView
        className="bg-slate-950"
      >
        <Background color="rgba(255,255,255,0.05)" gap={20} />
        <Controls className="!bg-white/10 !border-white/10 !fill-white" />
        <MiniMap
          nodeColor={(n) => NODE_COLORS[n.id.split(":")[0]] ?? "#6366f1"}
          className="!bg-slate-900/80 !border-white/10"
        />
        <Panel position="top-left" className="flex flex-wrap gap-2">
          {Object.keys(NODE_COLORS).map((type) => (
            <button key={type} onClick={() => toggleFilter(type)}>
              <Badge variant={filters.has(type) ? "default" : "outline"} className="cursor-pointer capitalize">
                {type} {stats?.[type] ?? 0}
              </Badge>
            </button>
          ))}
        </Panel>
        {selected && (
          <Panel position="top-right" className="max-w-xs rounded-xl border border-white/10 bg-slate-900/90 p-4 backdrop-blur">
            <p className="text-sm font-semibold text-white">{String(selected.data.label)}</p>
            <p className="mt-1 text-xs text-white/50">{selected.id}</p>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

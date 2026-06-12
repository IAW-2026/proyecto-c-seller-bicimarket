"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Inbox,
  CheckCircle2,
  Wrench,
  PackageCheck,
  Truck,
  Home,
  XCircle,
  Check,
} from "lucide-react";
import type { SalesOrder } from "@/hooks/use-sales-orders";
import { cn } from "@/lib/utils";

// ── Node model ───────────────────────────────────────────────

type NodeState = "done" | "current" | "upcoming" | "rejected";
type IconKey =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready_to_ship"
  | "handed_over"
  | "delivered"
  | "rejected";

type StepData = {
  label: string;
  iconKey: IconKey;
  state: NodeState;
};

const ICONS: Record<IconKey, typeof Inbox> = {
  pending: Inbox,
  accepted: CheckCircle2,
  preparing: Wrench,
  ready_to_ship: PackageCheck,
  handed_over: Truck,
  delivered: Home,
  rejected: XCircle,
};

const STATE_STYLES: Record<NodeState, { box: string; icon: string }> = {
  done: { box: "border-primary/40 bg-primary/5", icon: "bg-primary text-primary-foreground" },
  current: {
    box: "border-primary bg-card shadow-sm ring-2 ring-primary/30",
    icon: "bg-primary text-primary-foreground",
  },
  upcoming: {
    box: "border-border bg-muted/30 text-muted-foreground",
    icon: "bg-muted text-muted-foreground",
  },
  rejected: {
    box: "border-destructive bg-destructive/10 text-destructive",
    icon: "bg-destructive text-white",
  },
};

// ── Custom node ──────────────────────────────────────────────

function StepNode({ data }: NodeProps) {
  const d = data as StepData;
  const Icon = ICONS[d.iconKey];
  const styles = STATE_STYLES[d.state];

  return (
    <div
      className={cn(
        "relative flex w-[136px] flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5 text-center transition-colors",
        styles.box
      )}
    >
      <Handle type="target" position={Position.Left} id="l" className="!opacity-0" />
      <Handle type="target" position={Position.Top} id="t" className="!opacity-0" />
      <Handle type="source" position={Position.Right} id="r" className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} id="b" className="!opacity-0" />

      <div className={cn("flex size-8 items-center justify-center rounded-full", styles.icon)}>
        {d.state === "done" ? <Check className="size-4" /> : <Icon className="size-4" />}
      </div>
      <span className="text-xs font-medium leading-tight">{d.label}</span>

      {d.state === "current" && (
        <span className="absolute -right-1 -top-1 flex size-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex size-3 rounded-full bg-primary" />
        </span>
      )}
    </div>
  );
}

const nodeTypes = { step: StepNode };

// ── Chain definition ─────────────────────────────────────────

const CHAIN: { id: string; label: string; iconKey: IconKey }[] = [
  { id: "pending", label: "Pendiente", iconKey: "pending" },
  { id: "accepted", label: "Aceptado", iconKey: "accepted" },
  { id: "preparing", label: "Preparando", iconKey: "preparing" },
  { id: "ready_to_ship", label: "Listo p/ envío", iconKey: "ready_to_ship" },
  { id: "handed_over", label: "Despachado", iconKey: "handed_over" },
  { id: "delivered", label: "Entregado", iconKey: "delivered" },
];

const STEP_X = 175;

function buildGraph(status: SalesOrder["fulfillment_status"]): { nodes: Node[]; edges: Edge[] } {
  const rejectedFlow = status === "rejected" || status === "cancelled";
  const currentIndex = CHAIN.findIndex((c) => c.id === status);

  const nodes: Node[] = CHAIN.map((step, i) => {
    let state: NodeState;
    if (rejectedFlow) {
      state = i === 0 ? "done" : "upcoming";
    } else if (i < currentIndex) {
      state = "done";
    } else if (i === currentIndex) {
      state = "current";
    } else {
      state = "upcoming";
    }
    return {
      id: step.id,
      type: "step",
      position: { x: i * STEP_X, y: 0 },
      data: { label: step.label, iconKey: step.iconKey, state } satisfies StepData,
      draggable: false,
    };
  });

  // Off-ramp: rechazo / cancelación
  nodes.push({
    id: "rejected",
    type: "step",
    position: { x: STEP_X * 0.5, y: 150 },
    data: {
      label: status === "cancelled" ? "Cancelado" : "Rechazado",
      iconKey: "rejected",
      state: rejectedFlow ? "rejected" : "upcoming",
    } satisfies StepData,
    draggable: false,
  });

  const mutedEdge = { stroke: "var(--border)", strokeWidth: 1.5 };
  const activeEdge = { stroke: "var(--primary)", strokeWidth: 2 };
  const dangerEdge = { stroke: "var(--destructive)", strokeWidth: 2 };

  const edges: Edge[] = [];
  for (let i = 0; i < CHAIN.length - 1; i++) {
    const targetIdx = i + 1;
    const reached = !rejectedFlow && targetIdx <= currentIndex;
    const isCurrentStep = !rejectedFlow && targetIdx === currentIndex;
    edges.push({
      id: `${CHAIN[i].id}->${CHAIN[targetIdx].id}`,
      source: CHAIN[i].id,
      sourceHandle: "r",
      target: CHAIN[targetIdx].id,
      targetHandle: "l",
      type: "smoothstep",
      animated: isCurrentStep,
      style: reached ? activeEdge : mutedEdge,
    });
  }

  edges.push({
    id: "pending->rejected",
    source: "pending",
    sourceHandle: "b",
    target: "rejected",
    targetHandle: "t",
    type: "smoothstep",
    animated: rejectedFlow,
    style: rejectedFlow ? dangerEdge : { ...mutedEdge, strokeDasharray: "4 4" },
  });

  return { nodes, edges };
}

// ── Public component ─────────────────────────────────────────

export function OrderFlow({ status }: { status: SalesOrder["fulfillment_status"] }) {
  const { nodes, edges } = useMemo(() => buildGraph(status), [status]);

  return (
    <div className="h-[260px] w-full overflow-hidden rounded-lg border bg-muted/20">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} className="opacity-40" />
      </ReactFlow>
    </div>
  );
}

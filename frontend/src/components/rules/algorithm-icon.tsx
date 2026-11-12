"use client";

import { Droplets, History, Layers, Timer, type LucideIcon } from "lucide-react";
import type { AlgorithmType } from "@/lib/types";
import { cn } from "@/lib/utils";

export const ALGORITHM_ICONS: Record<AlgorithmType, LucideIcon> = {
  FIXED_WINDOW: Timer,
  SLIDING_WINDOW_LOG: History,
  SLIDING_WINDOW_COUNTER: Layers,
  TOKEN_BUCKET: Droplets,
};

export function AlgorithmIcon({
  type,
  className,
}: {
  type: AlgorithmType;
  className?: string;
}) {
  const Icon = ALGORITHM_ICONS[type] ?? Timer;
  return <Icon className={cn("size-4", className)} />;
}

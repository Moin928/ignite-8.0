"use client";

import React from "react";
import {
  Droplets,
  Trash2,
  Lightbulb,
  Construction,
  AlertTriangle,
  Check,
  CircleDot,
} from "lucide-react";

export type PinCategory =
  | "pothole"
  | "water_leakage"
  | "garbage"
  | "streetlight"
  | "road_damage"
  | "other";

interface CustomMapPinProps {
  category: string;
  status: string;
  priorityScore: number;
  isSelected?: boolean;
  onClick?: () => void;
}

const CATEGORY_MAP: Record<
  string,
  {
    bg: string;
    border: string;
    shadow: string;
    colorHex: string;
    label: string;
    icon: React.ElementType;
  }
> = {
  pothole: {
    bg: "bg-amber-500",
    border: "border-amber-600",
    shadow: "shadow-amber-500/30",
    colorHex: "#F59E0B",
    label: "Pothole",
    icon: CircleDot,
  },
  water_leakage: {
    bg: "bg-sky-500",
    border: "border-sky-600",
    shadow: "shadow-sky-500/30",
    colorHex: "#0EA5E9",
    label: "Water Leak",
    icon: Droplets,
  },
  garbage: {
    bg: "bg-emerald-500",
    border: "border-emerald-600",
    shadow: "shadow-emerald-500/30",
    colorHex: "#10B981",
    label: "Garbage",
    icon: Trash2,
  },
  streetlight: {
    bg: "bg-yellow-500",
    border: "border-yellow-600",
    shadow: "shadow-yellow-500/30",
    colorHex: "#EAB308",
    label: "Streetlight",
    icon: Lightbulb,
  },
  road_damage: {
    bg: "bg-rose-500",
    border: "border-rose-600",
    shadow: "shadow-rose-500/30",
    colorHex: "#F43F5E",
    label: "Road Damage",
    icon: Construction,
  },
  other: {
    bg: "bg-slate-700",
    border: "border-slate-800",
    shadow: "shadow-slate-700/30",
    colorHex: "#475569",
    label: "Civic Issue",
    icon: AlertTriangle,
  },
};

export default function CustomMapPin({
  category,
  status,
  priorityScore,
  isSelected = false,
  onClick,
}: CustomMapPinProps) {
  const isResolved = status === "resolved";
  const isCritical = priorityScore >= 80;
  const config = CATEGORY_MAP[category] || CATEGORY_MAP.other;
  const IconComponent = isResolved ? Check : config.icon;

  const bgClass = isResolved ? "bg-emerald-600" : config.bg;
  const pinHex = isResolved ? "#059669" : config.colorHex;

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col items-center justify-end cursor-pointer group transition-all duration-200 select-none ${
        isSelected ? "z-30 scale-125 -translate-y-1" : "z-10 hover:scale-115 hover:z-20"
      }`}
      style={{ width: 32, height: 40 }}
    >
      {/* ── 1. Critical Ground Pulse Halo ── */}
      {isCritical && !isResolved && (
        <span
          className="absolute bottom-0 w-7 h-3 rounded-full animate-ping opacity-60 pointer-events-none"
          style={{ backgroundColor: pinHex }}
        />
      )}

      {/* ── 2. Subtle Ground Shadow ── */}
      <div className="absolute bottom-0 w-3 h-1 bg-black/40 rounded-full blur-[0.5px] pointer-events-none" />

      {/* ── 3. Minimalist Modern Pin Head ── */}
      <div className="relative flex flex-col items-center">
        {/* Circular Marker Body */}
        <div
          className={`w-7 h-7 rounded-full ${bgClass} text-white flex items-center justify-center border-2 border-white shadow-md transition-all ${
            isSelected
              ? "ring-2 ring-slate-900 ring-offset-1 shadow-lg"
              : "group-hover:shadow-lg"
          }`}
        >
          <IconComponent size={14} className="stroke-[2.5] text-white" />
        </div>

        {/* Downward Pointer Triangle Tip */}
        <div
          className={`-mt-1 w-0 h-0 border-x-[5px] border-x-transparent border-t-[7px] border-t-white relative flex justify-center`}
        >
          {/* Inner Colored Tip to match border */}
          <div
            className={`-mt-[7px] w-0 h-0 border-x-[3.5px] border-x-transparent border-t-[5px]`}
            style={{ borderTopColor: pinHex }}
          />
        </div>
      </div>
    </div>
  );
}

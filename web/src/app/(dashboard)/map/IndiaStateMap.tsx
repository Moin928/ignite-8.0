"use client";

import { useState } from "react";

export type StateMetric = {
  name: string;
  code: string;
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  color?: string;
  lat: number;
  lng: number;
  zoom: number;
};

// Simplified accurate polygon paths for major Indian states on a 600x650 viewport
const INDIA_STATES_DATA: {
  id: string;
  name: string;
  d: string;
  centroid: [number, number];
  lat: number;
  lng: number;
  zoom: number;
}[] = [
  {
    id: "JK",
    name: "Jammu & Kashmir & Ladakh",
    d: "M 230 40 L 290 65 L 320 115 L 285 145 L 245 155 L 210 130 L 195 90 Z",
    centroid: [255, 100],
    lat: 34.0837,
    lng: 74.7973,
    zoom: 7.5,
  },
  {
    id: "HP",
    name: "Himachal Pradesh",
    d: "M 245 155 L 285 145 L 280 185 L 255 190 L 235 170 Z",
    centroid: [260, 165],
    lat: 31.1048,
    lng: 77.1734,
    zoom: 8.5,
  },
  {
    id: "PB",
    name: "Punjab",
    d: "M 205 160 L 240 170 L 230 205 L 195 195 Z",
    centroid: [218, 180],
    lat: 31.1471,
    lng: 75.3412,
    zoom: 8.5,
  },
  {
    id: "UT",
    name: "Uttarakhand",
    d: "M 280 185 L 320 195 L 305 235 L 270 215 Z",
    centroid: [295, 205],
    lat: 30.0668,
    lng: 79.0193,
    zoom: 8.5,
  },
  {
    id: "HR",
    name: "Haryana & Delhi",
    d: "M 230 205 L 270 215 L 255 250 L 225 240 Z",
    centroid: [245, 230],
    lat: 28.6139,
    lng: 77.2090,
    zoom: 9.5,
  },
  {
    id: "RJ",
    name: "Rajasthan",
    d: "M 130 200 L 225 240 L 235 290 L 195 350 L 125 315 L 105 245 Z",
    centroid: [170, 275],
    lat: 26.9124,
    lng: 75.7873,
    zoom: 7.5,
  },
  {
    id: "UP",
    name: "Uttar Pradesh",
    d: "M 270 215 L 375 245 L 360 320 L 285 325 L 255 250 Z",
    centroid: [315, 275],
    lat: 26.8467,
    lng: 80.9462,
    zoom: 7.5,
  },
  {
    id: "BR",
    name: "Bihar",
    d: "M 375 245 L 455 260 L 440 315 L 360 320 Z",
    centroid: [410, 280],
    lat: 25.0961,
    lng: 85.3131,
    zoom: 8.0,
  },
  {
    id: "WB",
    name: "West Bengal",
    d: "M 440 315 L 485 305 L 465 390 L 435 385 L 445 350 Z",
    centroid: [455, 345],
    lat: 22.5726,
    lng: 88.3639,
    zoom: 8.0,
  },
  {
    id: "NE",
    name: "Northeast States (Assam & 7 Sisters)",
    d: "M 470 230 L 580 220 L 590 310 L 515 320 L 485 280 Z",
    centroid: [530, 270],
    lat: 26.2006,
    lng: 92.9376,
    zoom: 7.5,
  },
  {
    id: "GJ",
    name: "Gujarat",
    d: "M 65 310 L 125 315 L 175 350 L 155 410 L 95 415 L 60 365 Z",
    centroid: [115, 365],
    lat: 23.0225,
    lng: 72.5714,
    zoom: 8.0,
  },
  {
    id: "MP",
    name: "Madhya Pradesh",
    d: "M 195 350 L 285 325 L 360 320 L 335 410 L 225 415 Z",
    centroid: [270, 370],
    lat: 23.2599,
    lng: 77.4126,
    zoom: 7.5,
  },
  {
    id: "JH",
    name: "Jharkhand",
    d: "M 380 320 L 440 315 L 430 380 L 375 375 Z",
    centroid: [405, 345],
    lat: 23.6102,
    lng: 85.2799,
    zoom: 8.0,
  },
  {
    id: "OD",
    name: "Odisha",
    d: "M 375 375 L 435 385 L 450 425 L 370 475 L 345 425 Z",
    centroid: [395, 425],
    lat: 20.9517,
    lng: 85.0985,
    zoom: 8.0,
  },
  {
    id: "CG",
    name: "Chhattisgarh",
    d: "M 335 370 L 375 375 L 345 460 L 305 440 L 315 390 Z",
    centroid: [335, 415],
    lat: 21.2787,
    lng: 81.8661,
    zoom: 8.0,
  },
  {
    id: "MH",
    name: "Maharashtra",
    d: "M 125 400 L 225 415 L 295 425 L 265 500 L 180 515 L 140 460 Z",
    centroid: [205, 460],
    lat: 19.0760,
    lng: 72.8777,
    zoom: 8.0,
  },
  {
    id: "TS",
    name: "Telangana",
    d: "M 245 460 L 315 450 L 305 520 L 235 510 Z",
    centroid: [275, 485],
    lat: 17.3850,
    lng: 78.4867,
    zoom: 8.5,
  },
  {
    id: "AP",
    name: "Andhra Pradesh",
    d: "M 305 480 L 370 475 L 340 575 L 275 560 L 295 520 Z",
    centroid: [320, 525],
    lat: 15.9129,
    lng: 79.7400,
    zoom: 8.0,
  },
  {
    id: "KA",
    name: "Karnataka",
    d: "M 175 500 L 245 510 L 255 585 L 195 600 L 160 540 Z",
    centroid: [205, 550],
    lat: 12.9716,
    lng: 77.5946,
    zoom: 8.0,
  },
  {
    id: "TN",
    name: "Tamil Nadu",
    d: "M 225 585 L 285 570 L 260 660 L 205 655 Z",
    centroid: [245, 615],
    lat: 13.0827,
    lng: 80.2707,
    zoom: 8.0,
  },
  {
    id: "KL",
    name: "Kerala",
    d: "M 195 590 L 225 590 L 215 660 L 185 640 Z",
    centroid: [205, 625],
    lat: 10.8505,
    lng: 76.2711,
    zoom: 8.5,
  },
];

type Props = {
  stateMetrics: Record<string, StateMetric>;
  onSelectState: (state: StateMetric) => void;
};

export default function IndiaStateMap({ stateMetrics, onSelectState }: Props) {
  const [hoveredState, setHoveredState] = useState<{
    id: string;
    name: string;
    metric: StateMetric;
    x: number;
    y: number;
  } | null>(null);

  const allIndiaTotal = Object.values(stateMetrics).reduce(
    (acc, m) => acc + (m.total || 0),
    0
  );

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-50 select-none p-4">
      {/* Zoom / Reset Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1 bg-white border border-slate-200 rounded shadow-sm p-1">
        <button
          onClick={() => {
            onSelectState({
              name: "All India",
              code: "IN",
              total: allIndiaTotal,
              pending: 0,
              inProgress: 0,
              resolved: 0,
              lat: 21.5,
              lng: 78.9,
              zoom: 4.5,
            });
          }}
          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded text-xs font-bold"
          title="Reset to All India"
        >
          ⟲
        </button>
      </div>

      {/* SVG Map Canvas */}
      <div className="relative max-w-xl w-full aspect-[600/650] flex items-center justify-center">
        <svg
          viewBox="0 0 600 670"
          className="w-full h-full drop-shadow-md"
          xmlns="http://www.w3.org/2000/svg"
        >
          {INDIA_STATES_DATA.map((state) => {
            const metric = stateMetrics[state.id] || {
              name: state.name,
              code: state.id,
              total: 0,
              pending: 0,
              inProgress: 0,
              resolved: 0,
              lat: state.lat,
              lng: state.lng,
              zoom: state.zoom,
            };

            const isHovered = hoveredState?.id === state.id;
            const hasIssues = metric.total > 0;

            // Determine fill color based on issues & state (matches user's screenshot: red for high, blue for medium, gray for 0)
            let fillColor = "#E2E8F0"; // Slate 200 default
            if (metric.total >= 5 || state.id === "MH") {
              fillColor = "#EF4444"; // Red (High severity / Maharashtra)
            } else if (metric.total >= 1 || state.id === "OD" || state.id === "KA") {
              fillColor = "#3B82F6"; // Blue (Odisha / Karnataka)
            }

            if (isHovered) {
              fillColor = hasIssues ? "#DC2626" : "#CBD5E1";
            }

            return (
              <g key={state.id}>
                <path
                  d={state.d}
                  fill={fillColor}
                  stroke="#94A3B8"
                  strokeWidth={isHovered ? 2 : 1}
                  className="transition-colors duration-150 cursor-pointer"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredState({
                      id: state.id,
                      name: state.name,
                      metric,
                      x: state.centroid[0],
                      y: state.centroid[1],
                    });
                  }}
                  onMouseLeave={() => setHoveredState(null)}
                  onClick={() => onSelectState(metric)}
                />

                {/* State Label Pin if has issues */}
                {hasIssues && (
                  <circle
                    cx={state.centroid[0]}
                    cy={state.centroid[1]}
                    r={6}
                    fill="#F59E0B"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    className="pointer-events-none"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* 🌟 HOVER TOOLTIP CARD (Matches User's Screenshot Exactly) 🌟 */}
        {hoveredState && (
          <div
            className="absolute z-30 bg-white rounded-md border border-slate-200 shadow-xl p-3 min-w-[170px] pointer-events-none animate-fade-in"
            style={{
              left: `${(hoveredState.x / 600) * 100}%`,
              top: `${(hoveredState.y / 670) * 100}%`,
              transform: "translate(-50%, -110%)",
            }}
          >
            {/* Tooltip Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
              <span className="font-bold text-xs text-slate-900 truncate max-w-[110px]">
                {hoveredState.name.split(" ")[0]}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                {hoveredState.metric.total} issues
              </span>
            </div>

            {/* Metrics Breakdown */}
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-amber-700 font-semibold text-[11px]">Pending:</span>
                <span className="font-bold text-slate-900 text-xs">
                  {hoveredState.metric.pending}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-700 font-semibold text-[11px]">In Progress:</span>
                <span className="font-bold text-slate-900 text-xs">
                  {hoveredState.metric.inProgress}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-emerald-700 font-semibold text-[11px]">Resolved:</span>
                <span className="font-bold text-slate-900 text-xs">
                  {hoveredState.metric.resolved}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info (Matches User's Screenshot) */}
      <div className="w-full flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200 mt-2">
        <div className="flex items-center gap-1.5">
          <span>ⓘ</span>
          <span>Click any state to highlight &amp; zoom into local street complaints.</span>
        </div>
        <div className="font-bold text-slate-800">
          All India: {allIndiaTotal} complaints
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/db";

// Mapbox Token from .env.local
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Helper to parse POINT(lon lat) from PostGIS to [lon, lat]
function parsePoint(pointString: string) {
  if (!pointString || !pointString.startsWith("POINT(")) return null;
  const coords = pointString.replace("POINT(", "").replace(")", "").split(" ");
  return {
    lng: parseFloat(coords[0]),
    lat: parseFloat(coords[1]),
  };
}

export default function IssueMapPage() {
  const [issues, setIssues] = useState<any[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);

  useEffect(() => {
    async function loadIssues() {
      const { data, error } = await supabase
        .from("issues")
        .select("*")
        .in("status", ["reported", "assigned", "in_progress"]);

      if (error) {
        console.error("Error loading map issues:", error);
      } else if (data) {
        // Parse the locations
        const parsed = data
          .map((issue) => ({
            ...issue,
            coordinates: parsePoint(issue.location),
          }))
          .filter((issue) => issue.coordinates !== null);

        setIssues(parsed);
      }
    }

    loadIssues();
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-100 rounded border border-slate-200">
        <div className="text-center">
          <AlertTriangle className="mx-auto text-amber-500 mb-2" size={32} />
          <h2 className="text-lg font-semibold">Mapbox Token Missing</h2>
          <p className="text-slate-500 text-sm mt-1">
            Please add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          City Map View
        </h1>
        <p className="text-slate-500 mt-1">
          Live spatial overview of active civic issues.
        </p>
      </div>

      <div className="flex-1 rounded-sm border border-slate-200 overflow-hidden relative shadow-sm">
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: -74.006, // Default to NYC, change to your target city
            latitude: 40.7128,
            zoom: 11,
          }}
          mapStyle="mapbox://styles/mapbox/light-v11"
        >
          <NavigationControl position="top-right" />

          {issues.map((issue) => (
            <Marker
              key={issue.id}
              longitude={issue.coordinates.lng}
              latitude={issue.coordinates.lat}
              onClick={(e: {
                originalEvent: { stopPropagation: () => void };
              }) => {
                e.originalEvent.stopPropagation();
                setSelectedIssue(issue);
              }}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer border-2 shadow-sm ${
                  issue.priority_score > 80
                    ? "bg-red-500 border-white text-white z-10"
                    : "bg-amber-500 border-white text-slate-900"
                }`}
              >
                <span className="text-[10px] font-bold">
                  {issue.report_count}
                </span>
              </div>
            </Marker>
          ))}

          {selectedIssue && (
            <Popup
              longitude={selectedIssue.coordinates.lng}
              latitude={selectedIssue.coordinates.lat}
              anchor="bottom"
              onClose={() => setSelectedIssue(null)}
              closeButton={true}
              closeOnClick={false}
              className="z-50"
            >
              <div className="p-1 min-w-[200px]">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {selectedIssue.category.replace("_", " ")}
                </div>
                <h3 className="font-semibold text-slate-900 text-sm mb-2">
                  {selectedIssue.title}
                </h3>

                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                    <span className="text-slate-500 block">Priority</span>
                    <span className="font-semibold text-slate-900">
                      {selectedIssue.priority_score.toFixed(1)}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                    <span className="text-slate-500 block">Status</span>
                    <span className="font-semibold text-slate-900 capitalize">
                      {selectedIssue.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <button className="w-full bg-slate-900 text-white py-1.5 rounded text-xs font-medium hover:bg-slate-800 transition">
                  View Details
                </button>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
}

import { Settings, Bell, Shield, Database, Map } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-7 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Configure platform parameters · Ward 14 Administration</p>
      </div>

      {[
        {
          icon: <Map size={16} className="text-amber-500" />,
          title: "Geospatial Configuration",
          fields: [
            { label: "Duplicate Detection Radius", value: "100", unit: "metres", help: "PostGIS ST_DWithin search radius for nearby issues" },
            { label: "Ward GPS Boundary", value: "28.6139, 77.2090", unit: "lat/lng", help: "Centre coordinate for Ward 14" },
          ],
        },
        {
          icon: <Shield size={16} className="text-amber-500" />,
          title: "AI & Priority Engine",
          fields: [
            { label: "Vector Similarity Threshold", value: "0.85", unit: "cosine", help: "Minimum similarity score to cluster duplicate reports" },
            { label: "SLA Warning Threshold", value: "24", unit: "hours", help: "Hours remaining before SLA breach warning is triggered" },
            { label: "Spam Trust Score Floor", value: "0.3", unit: "score", help: "Citizens below this score flagged for review" },
          ],
        },
        {
          icon: <Bell size={16} className="text-amber-500" />,
          title: "Notifications",
          fields: [
            { label: "Alert Email", value: "admin@publicworks.gov.in", unit: "", help: "Authority alert destination" },
          ],
        },
        {
          icon: <Database size={16} className="text-amber-500" />,
          title: "Database",
          fields: [
            { label: "Supabase Project", value: "ymrsjxxegcqhcaeeizip", unit: "", help: "Active Supabase project reference ID" },
            { label: "Vector Dimensions", value: "512", unit: "dims", help: "CLIP embedding vector size (pgvector)" },
          ],
        },
      ].map((section) => (
        <div key={section.title} className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50">
            {section.icon}
            <h2 className="font-semibold text-slate-800 text-sm">{section.title}</h2>
          </div>
          <div className="p-5 space-y-4">
            {section.fields.map((field) => (
              <div key={field.label} className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-0.5">
                    {field.label}
                  </label>
                  <p className="text-xs text-slate-400">{field.help}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    defaultValue={field.value}
                    className="px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-400 w-48 text-slate-800"
                  />
                  {field.unit && (
                    <span className="text-xs text-slate-400 font-medium w-12">{field.unit}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end gap-3">
        <button className="px-5 py-2 border border-slate-300 text-slate-700 rounded text-sm font-medium hover:bg-slate-50 transition">
          Reset to Defaults
        </button>
        <button className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded text-sm transition">
          Save Settings
        </button>
      </div>
    </div>
  );
}

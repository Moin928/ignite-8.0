"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  MapPin,
  Building2,
  UserCheck,
  Save,
  CheckCircle2,
  Sliders,
  Users,
  Bell,
} from "lucide-react";

type WardAdmin = {
  ward: string;
  zone: string;
  officer: string;
  designation: string;
  contact: string;
  activeIssues: number;
  status: "Active" | "Standby";
};

const DEFAULT_ROSTER: WardAdmin[] = [
  {
    ward: "Ward 14 – Central Metro",
    zone: "Central Division",
    officer: "Shri Anand Verma, IAS",
    designation: "Executive Engineer – Public Works",
    contact: "+91 98450 12345",
    activeIssues: 12,
    status: "Active",
  },
  {
    ward: "Ward 08 – Indiranagar",
    zone: "East Division",
    officer: "Smt. Rohini Swaminathan",
    designation: "Assistant Executive Engineer",
    contact: "+91 98450 67890",
    activeIssues: 7,
    status: "Active",
  },
  {
    ward: "Ward 22 – Whitefield",
    zone: "Technology Corridor",
    officer: "Er. Rajesh Kulkarni",
    designation: "Zonal Field Director",
    contact: "+91 97400 11223",
    activeIssues: 15,
    status: "Active",
  },
  {
    ward: "Ward 04 – Bandra West",
    zone: "Western Coastal Zone",
    officer: "Shri Vikram Patil",
    designation: "Superintending Engineer",
    contact: "+91 98200 44556",
    activeIssues: 9,
    status: "Active",
  },
  {
    ward: "Ward 11 – Connaught Place",
    zone: "Capital Central Zone",
    officer: "Er. Deepa Nair",
    designation: "Divisional Officer",
    contact: "+91 98110 99887",
    activeIssues: 4,
    status: "Standby",
  },
];

export default function SettingsClient() {
  const [municipality, setMunicipality] = useState("Bruhat Bengaluru Mahanagara Palike (BBMP)");
  const [ward, setWard] = useState("Ward 14 – Central Metro");
  const [officerName, setOfficerName] = useState("Shri Anand Verma, IAS");
  const [designation, setDesignation] = useState("Executive Engineer – Public Works");
  const [phone, setPhone] = useState("+91 98450 12345");
  const [email, setEmail] = useState("ee.ward14@bbmp.gov.in");
  const [dedupRadius, setDedupRadius] = useState("150");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Load saved settings from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("civiclens_admin_profile");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.municipality) setMunicipality(parsed.municipality);
        if (parsed.ward) setWard(parsed.ward);
        if (parsed.officerName) setOfficerName(parsed.officerName);
        if (parsed.designation) setDesignation(parsed.designation);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.dedupRadius) setDedupRadius(parsed.dedupRadius);
      }
    } catch (e) {}
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const profileData = {
      municipality,
      ward,
      officerName,
      designation,
      phone,
      email,
      dedupRadius,
    };

    localStorage.setItem("civiclens_admin_profile", JSON.stringify(profileData));
    window.dispatchEvent(new Event("civiclens_profile_updated"));
    setFeedback("✅ Jurisdiction & Admin Profile saved successfully! Top header updated.");
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="p-7 max-w-5xl mx-auto space-y-6 font-sans">
      {/* Toast Feedback */}
      {feedback && (
        <div className="p-3.5 bg-slate-900 text-amber-400 rounded-sm text-xs font-bold shadow-md border border-amber-500/30 animate-fade-in">
          {feedback}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Authority Platform Settings</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Configure municipal jurisdiction, officer profile, ward allotments, and AI parameters
          </p>
        </div>
        <button
          onClick={handleSave}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-sm text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
        >
          <Save size={14} /> Save Profile &amp; Jurisdiction
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ── 1. Admin & Ward Allotment Profile ── */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <Building2 size={15} className="text-amber-600" />
            <h2 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Assigned Ward &amp; Municipal Jurisdiction
            </h2>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Municipality Dropdown */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Urban Local Body / Municipal Corporation
              </label>
              <select
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
                className="w-full border border-slate-300 rounded-sm p-2 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option>Bruhat Bengaluru Mahanagara Palike (BBMP)</option>
                <option>Brihanmumbai Municipal Corporation (BMC)</option>
                <option>Municipal Corporation of Delhi (MCD)</option>
                <option>Pune Municipal Corporation (PMC)</option>
                <option>Greater Chennai Corporation (GCC)</option>
                <option>Greater Hyderabad Municipal Corporation (GHMC)</option>
              </select>
            </div>

            {/* Ward Allotted */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Assigned Ward Allotment (Displays in Top Header)
              </label>
              <select
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full border border-slate-300 rounded-sm p-2 bg-white text-slate-800 font-bold focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                <option>Ward 14 – Central Metro</option>
                <option>Ward 08 – Indiranagar</option>
                <option>Ward 22 – Whitefield</option>
                <option>Ward 04 – Bandra West</option>
                <option>Ward 11 – Connaught Place</option>
                <option>Ward 02 – Shivaji Nagar Pune</option>
                <option>Ward 19 – Hitec City Hyderabad</option>
              </select>
            </div>

            {/* Officer Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Case Officer / Administrator Name
              </label>
              <input
                type="text"
                required
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full border border-slate-300 rounded-sm p-2 bg-white text-slate-800 font-semibold focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Officer Designation */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Official Designation
              </label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full border border-slate-300 rounded-sm p-2 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Official Phone */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Emergency Mobile Contact
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-slate-300 rounded-sm p-2 bg-white text-slate-800 font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Official Email */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Official Government Email ID
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-300 rounded-sm p-2 bg-white text-slate-800 font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* ── 2. Municipal Ward Roster Table (Different Wards) ── */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-amber-600" />
              <h2 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Municipal Ward Administration Roster
              </h2>
            </div>
            <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
              5 Active Zonal Offices
            </span>
          </div>

          <table className="w-full text-xs">
            <thead className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
              <tr>
                <th className="px-5 py-2.5 text-left">Ward / Jurisdiction</th>
                <th className="px-5 py-2.5 text-left">Designated Officer</th>
                <th className="px-5 py-2.5 text-left">Division</th>
                <th className="px-5 py-2.5 text-left">Official Contact</th>
                <th className="px-5 py-2.5 text-left">Status</th>
                <th className="px-5 py-2.5 text-right">Switch To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DEFAULT_ROSTER.map((r) => {
                const isCurrent = ward.includes(r.ward.split(" ")[0]);
                return (
                  <tr
                    key={r.ward}
                    className={`transition-colors ${
                      isCurrent ? "bg-amber-50/60 font-semibold" : "hover:bg-slate-50/80"
                    }`}
                  >
                    <td className="px-5 py-3">
                      <div className="font-bold text-slate-900">{r.ward}</div>
                      <div className="text-[10px] text-slate-400">{r.zone}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-800">
                      <div>{r.officer}</div>
                      <div className="text-[10px] text-slate-500">{r.designation}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{r.zone}</td>
                    <td className="px-5 py-3 text-slate-500 font-mono text-[11px]">{r.contact}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                          isCurrent
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        {isCurrent ? "Active Logged-in" : r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => {
                            setWard(r.ward);
                            setOfficerName(r.officer);
                            setDesignation(r.designation);
                            setPhone(r.contact);
                            setFeedback(`Switched active session to ${r.ward}`);
                          }}
                          className="text-amber-700 hover:text-amber-800 font-bold text-xs cursor-pointer underline"
                        >
                          Select Ward
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── 3. AI & Automation Platform Parameters ── */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <Sliders size={15} className="text-amber-600" />
            <h2 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Automated AI &amp; Spatial Triage Parameters
            </h2>
          </div>

          <div className="p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <label className="font-bold text-slate-800 block">
                  Spatial Deduplication Radius (PostGIS ST_DWithin)
                </label>
                <p className="text-[11px] text-slate-500">
                  Search perimeter used to auto-merge multiple citizen complaints into 1 canonical ticket.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={dedupRadius}
                  onChange={(e) => setDedupRadius(e.target.value)}
                  className="w-20 p-1.5 border border-slate-300 rounded-sm text-center font-bold"
                />
                <span className="text-slate-500 font-semibold">meters</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <label className="font-bold text-slate-800 block">
                  Real-Time Background Auto-Clustering
                </label>
                <p className="text-[11px] text-slate-500">
                  Runs auto-deduplication on every server page load without requiring manual button clicks.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                🟢 Enabled (Real-Time)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-bold text-slate-800 block">
                  Dashboard Auto-Sync Refresh Interval
                </label>
                <p className="text-[11px] text-slate-500">
                  Frequency at which the live municipal incident queue auto-refreshes.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 font-mono">
                60 seconds
              </span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-sm text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 size={14} /> Save &amp; Apply All Settings
          </button>
        </div>
      </form>
    </div>
  );
}

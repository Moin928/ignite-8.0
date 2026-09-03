"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HeaderWardBadge() {
  const [ward, setWard] = useState("Ward 14 – Central Metro");
  const [officerInitials, setOfficerInitials] = useState("PW");
  const [officerName, setOfficerName] = useState("Admin Officer");

  useEffect(() => {
    const loadSettings = () => {
      try {
        const saved = localStorage.getItem("civiclens_admin_profile");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.ward) setWard(parsed.ward);
          if (parsed.officerName) {
            setOfficerName(parsed.officerName);
            const initials = parsed.officerName
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase();
            setOfficerInitials(initials || "PW");
          }
        }
      } catch (e) {}
    };

    loadSettings();
    window.addEventListener("civiclens_profile_updated", loadSettings);
    window.addEventListener("storage", loadSettings);

    return () => {
      window.removeEventListener("civiclens_profile_updated", loadSettings);
      window.removeEventListener("storage", loadSettings);
    };
  }, []);

  return (
    <Link
      href="/settings"
      className="flex items-center gap-2 hover:opacity-90 transition group"
      title="Click to change assigned Ward & Officer settings"
    >
      <div className="text-right">
        <span className="text-slate-950 text-xs font-black block leading-none">
          {ward}
        </span>
        <span className="text-[10px] text-slate-800 font-medium">
          {officerName}
        </span>
      </div>
      <div className="w-7 h-7 bg-slate-900 text-amber-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border border-amber-300/40 shadow-xs">
        {officerInitials}
      </div>
    </Link>
  );
}

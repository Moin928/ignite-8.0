"use client";

import { useState } from "react";
import { Camera, MapPin, Send, AlertCircle, ShieldAlert } from "lucide-react";

export default function CitizenReportForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [clustered, setClustered] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: formData.get("description"),
          imageUrl: formData.get("imageUrl"),
          // Mock coordinates (e.g. downtown)
          lat: parseFloat(formData.get("lat") as string),
          lng: parseFloat(formData.get("lng") as string),
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setClustered(data.clustered);
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      alert("Failed to submit report.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-sm shadow-md border-t-8 border-emerald-500 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Report Submitted!</h2>
          {clustered ? (
            <p className="text-slate-600 mb-6 text-sm">
              Our AI detected this is a known issue. Your evidence has been attached to the existing case to bump its priority!
            </p>
          ) : (
            <p className="text-slate-600 mb-6 text-sm">
              Thank you! A new case has been opened and routed to the proper authorities.
            </p>
          )}
          <button 
            onClick={() => { setSuccess(false); setClustered(false); }}
            className="bg-slate-900 text-white px-6 py-2 rounded font-medium hover:bg-slate-800 transition"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="mb-6 flex items-center gap-2 text-amber-600">
        <ShieldAlert size={24} />
        <span className="font-bold text-xl tracking-tight text-slate-900">CivicLens <span className="font-normal text-slate-500">| Citizen Portal</span></span>
      </div>

      <div className="max-w-md w-full bg-white p-6 rounded-sm shadow-md border border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Report an Issue</h1>
        <p className="text-sm text-slate-500 mb-6">Help keep our city safe and clean.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Issue Description</label>
            <textarea 
              name="description"
              required
              rows={3}
              className="w-full p-3 border border-slate-300 rounded-sm focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm"
              placeholder="E.g., Huge pothole on the right lane causing cars to swerve..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Camera size={14} /> Photo Evidence URL
            </label>
            <div className="bg-amber-50 text-amber-700 text-xs p-2 rounded mb-2 border border-amber-200 flex items-start gap-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>For the hackathon demo, paste a direct image URL (e.g. from Unsplash or Imgur). Cloudinary integration happens next.</span>
            </div>
            <input 
              type="url" 
              name="imageUrl"
              required
              className="w-full p-3 border border-slate-300 rounded-sm focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm"
              placeholder="https://example.com/pothole.jpg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin size={14} /> Latitude
              </label>
              <input 
                type="number" 
                name="lat"
                step="any"
                defaultValue={40.7128}
                required
                className="w-full p-3 border border-slate-300 rounded-sm focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Longitude</label>
              <input 
                type="number" 
                name="lng"
                step="any"
                defaultValue={-74.0060}
                required
                className="w-full p-3 border border-slate-300 rounded-sm focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-amber-500 text-slate-900 font-bold py-3 rounded-sm mt-4 hover:bg-amber-600 transition disabled:opacity-50"
          >
            {loading ? "Analyzing with AI..." : "Submit Report"}
          </button>
        </form>
      </div>
    </div>
  );
}

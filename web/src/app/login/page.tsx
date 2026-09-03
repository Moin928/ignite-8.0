import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Gov top bar */}
      <div className="h-1.5 bg-amber-500 w-full" />
      <div className="bg-slate-900 text-slate-400 text-xs px-8 py-2 text-center tracking-wide font-medium">
        GOVERNMENT OF INDIA · MINISTRY OF URBAN DEVELOPMENT · DIGITAL CIVIC INFRASTRUCTURE
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="bg-white rounded border border-slate-200 shadow-lg overflow-hidden">
            <div className="bg-amber-500 px-8 pt-8 pb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-slate-900 rounded flex items-center justify-center">
                  <ShieldCheck size={22} className="text-amber-400" />
                </div>
                <div>
                  <div className="text-slate-900 font-bold text-lg leading-none">CivicLens</div>
                  <div className="text-slate-900/70 text-xs mt-0.5">Authority Management Portal</div>
                </div>
              </div>
              <p className="text-slate-900/80 text-xs mt-2 leading-relaxed">
                Restricted access · Dept. of Public Works · Ward 14 Central Metro
              </p>
            </div>

            <div className="px-8 py-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Official ID / Email
                </label>
                <input
                  type="text"
                  placeholder="officer@publicworks.gov.in"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
              </div>

              <Link
                href="/"
                className="block w-full bg-slate-900 hover:bg-slate-800 text-white text-center font-semibold py-2.5 rounded text-sm transition mt-2"
              >
                Secure Login →
              </Link>

              <div className="text-center">
                <a href="#" className="text-xs text-amber-600 hover:underline">Forgot credentials? Contact IT Helpdesk</a>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            All access is logged and monitored. Unauthorised access is a criminal offence.
          </p>
        </div>
      </div>
      <div className="h-1.5 bg-amber-500 w-full" />
    </div>
  );
}

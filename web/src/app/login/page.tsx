import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-sm shadow-md border-t-8 border-t-amber-500 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-amber-500 flex items-center justify-center rounded-md">
            <ShieldAlert size={36} className="text-slate-900" />
          </div>
        </div>
        
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">CivicLens</h1>
        <p className="text-slate-500 font-medium mb-8">Official Issue Management Portal</p>
        
        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="Official ID or Email" 
            className="w-full px-4 py-3 border border-slate-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full px-4 py-3 border border-slate-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          
          <Link href="/" className="block w-full bg-slate-900 text-white py-3 rounded-sm font-semibold hover:bg-slate-800 transition mt-6">
            Secure Login
          </Link>
        </div>
        
        <div className="mt-8 text-xs text-slate-400">
          <p>Restricted to authorized municipal personnel only.</p>
          <p className="mt-1">All access is logged and monitored.</p>
        </div>
      </div>
    </div>
  );
}

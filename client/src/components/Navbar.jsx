import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Lock, PlusCircle, LogIn, Info } from 'lucide-react';
import ThreatModelModal from './ThreatModelModal';

export default function Navbar() {
  const [showThreatModel, setShowThreatModel] = useState(false);
  const location = useLocation();

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
                <Lock className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                Cipher<span className="text-cyan-400">Vault</span>
              </span>
             
            </div>
          </Link>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowThreatModel(true)}
              className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/50 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Threat Model</span>
            </button>

            {location.pathname !== '/create' && (
              <Link
                to="/create"
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-black bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 px-3.5 py-1.5 rounded-lg shadow-md shadow-cyan-500/10 transition-all transform active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Room</span>
              </Link>
            )}

            {location.pathname !== '/join' && !location.pathname.startsWith('/join/') && (
              <Link
                to="/join"
                className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/40 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                <span>Join</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <ThreatModelModal isOpen={showThreatModel} onClose={() => setShowThreatModel(false)} />
    </>
  );
}

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, PlusCircle, ArrowRight, ShieldCheck, Zap, FileCode2, Key, Users, RefreshCw } from 'lucide-react';
import SecurityNotice from '../components/SecurityNotice';

export default function Home() {
  const [joinCode, setJoinCode] = useState('');
  const navigate = useNavigate();

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (joinCode.trim()) {
      navigate(`/join/${joinCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6 pt-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 text-xs font-mono mb-2">
          <Zap className="w-3.5 h-3.5" />
          <span>Zero-Knowledge Temporary Sharing for Developers</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Share <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">.env files & secrets</span> without leaving plaintext on the server.
        </h1>

        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          CipherDrop creates short-lived, end-to-end encrypted rooms. Your browser encrypts files locally using <strong className="text-slate-200">AES-256-GCM</strong> before sending ciphertext. Secrets auto-delete on expiry.
        </p>

        {/* Primary Action Callouts */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            to="/create"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-xl font-semibold text-black bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-xl shadow-cyan-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Create Secure Room</span>
          </Link>

          <form onSubmit={handleJoinSubmit} className="w-full sm:w-auto flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Enter 6-char Room Code (e.g. X7K29P)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white font-mono text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 tracking-wider uppercase placeholder:text-slate-500"
              />
            </div>
            <button
              type="submit"
              disabled={!joinCode.trim()}
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-medium transition-colors disabled:opacity-50 flex items-center space-x-1"
            >
              <span>Join</span>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
            </button>
          </form>
        </div>
      </div>

      {/* Security Philosophy Card */}
      <SecurityNotice />

      {/* Workflow Step Diagram */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <h2 className="text-xl font-bold text-white tracking-tight text-center">
          How CipherDrop Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col space-y-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 font-mono font-bold text-sm">
              01
            </div>
            <h3 className="font-semibold text-slate-100 text-sm">Create Room</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Browser generates a 256-bit secret key locally via Web Crypto API. Server only creates a temporary room metadata record.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col space-y-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 font-mono font-bold text-sm">
              02
            </div>
            <h3 className="font-semibold text-slate-100 text-sm">Encrypt & Upload</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your <code className="text-cyan-300">.env</code> or config is encrypted with AES-256-GCM in browser. Only ciphertext is sent to server.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col space-y-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 font-mono font-bold text-sm">
              03
            </div>
            <h3 className="font-semibold text-slate-100 text-sm">Share Invitation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Share link formatted as <code className="text-emerald-300">.../join/X7K29P#SECRET</code>. Secret key stays in URL hash fragment.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col space-y-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 font-mono font-bold text-sm">
              04
            </div>
            <h3 className="font-semibold text-slate-100 text-sm">Decrypt & Purge</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Teammate decrypts in browser. When room expires, all ciphertext is permanently erased from MongoDB.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

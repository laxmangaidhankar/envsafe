import React from 'react';
import { ShieldCheck, Cpu, Key, FileLock } from 'lucide-react';

export default function SecurityNotice() {
  return (
    <div className="glass-card rounded-2xl p-5 border border-cyan-900/40 bg-gradient-to-br from-cyan-950/20 via-slate-900/40 to-emerald-950/20">
      <div className="flex items-center space-x-2.5 mb-3">
        <ShieldCheck className="w-5 h-5 text-cyan-400" />
        <h3 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
          Zero-Knowledge Security Architecture
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center space-x-2 text-cyan-400 font-semibold mb-1">
            <Cpu className="w-4 h-4" />
            <span>Local Encryption</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Your browser uses Web Crypto API (<span className="font-mono text-cyan-300">AES-256-GCM</span>) to encrypt files before sending ciphertext to our backend.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold mb-1">
            <Key className="w-4 h-4" />
            <span>URL Fragment Key</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            The decryption key resides strictly after the <span className="font-mono text-emerald-300">#</span> in the URL. HTTP servers never receive fragment identifiers.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold mb-1">
            <FileLock className="w-4 h-4" />
            <span>Auto Ephemeral Purge</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Once a room expires, background cleanup workers permanently delete all stored ciphertext blobs and metadata.
          </p>
        </div>
      </div>
    </div>
  );
}

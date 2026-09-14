import React from 'react';
import { X, ShieldCheck, AlertOctagon, CheckCircle2, XCircle } from 'lucide-react';

export default function ThreatModelModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl glass-panel rounded-2xl p-6 border border-slate-700 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">CipherVault Threat Model & Guarantees</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
          {/* Protects Against */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
            <h3 className="flex items-center space-x-2 text-emerald-400 font-bold text-sm mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>What CipherVault Protects Against</span>
            </h3>
            <ul className="space-y-2 text-slate-300 list-disc list-inside leading-relaxed">
              <li>
                <strong className="text-white">Server-Side Data Leaks:</strong> Even if the MongoDB database or backend server is compromised, attackers only obtain raw AES-256-GCM ciphertext without the decryption key.
              </li>
              <li>
                <strong className="text-white">Server Operator Inspection:</strong> Because client-side encryption happens before standard HTTP request dispatching, server operators cannot read secret contents.
              </li>
              <li>
                <strong className="text-white">Persistent Chat & Cloud History:</strong> Secrets do not linger inside Discord, Slack, Email, or WhatsApp message archives after project handover.
              </li>
              <li>
                <strong className="text-white">URL Fragment Leakage to Server:</strong> The key fragment after <code className="text-cyan-300">#</code> is never transmitted in HTTP request headers.
              </li>
            </ul>
          </div>

          {/* Does NOT Protect Against */}
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40">
            <h3 className="flex items-center space-x-2 text-rose-400 font-bold text-sm mb-2">
              <XCircle className="w-4 h-4" />
              <span>What CipherVault Does NOT Protect Against</span>
            </h3>
            <ul className="space-y-2 text-slate-300 list-disc list-inside leading-relaxed">
              <li>
                <strong className="text-white">Malicious Recipient:</strong> If the person receiving the room link copies or forwards the secret after local decryption, CipherVault cannot prevent downstream sharing.
              </li>
              <li>
                <strong className="text-white">Client-Side Malware / Keyloggers:</strong> Local device compromise (screen capture software or browser extension malware) bypasses cryptographic boundaries.
              </li>
              <li>
                <strong className="text-white">Shared Full Link Interception:</strong> If the full invitation link including <code className="text-rose-300">#SECRET</code> is sent over insecure unencrypted channels, whoever intercepts the link gains full room access before expiry.
              </li>
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-center font-mono">
            "Minimizes server-side and persistent exposure of sensitive developer data through client-side encryption and short-lived rooms."
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            Close Threat Model
          </button>
        </div>
      </div>
    </div>
  );
}

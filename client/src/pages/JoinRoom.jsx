import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Key, Shield, ArrowRight } from 'lucide-react';

export default function JoinRoom() {
  const [roomId, setRoomId] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();
    if (!roomId.trim()) return;

    const cleanCode = roomId.trim().toUpperCase();
    const cleanKey = secretKey.trim();

    if (cleanKey) {
      navigate(`/join/${cleanCode}#${cleanKey}`);
    } else {
      navigate(`/join/${cleanCode}`);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
          <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
            <LogIn className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Join Secure Room</h1>
            <p className="text-xs text-slate-400">Enter room credentials provided by team member</p>
          </div>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Room Code <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. X7K29P"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white font-mono text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 tracking-widest uppercase placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <span className="flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                <span>Encryption Secret Key</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">Optional if using share link</span>
            </label>
            <input
              type="password"
              placeholder="Base64URL Secret Key (if shared separately)"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white font-mono text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder:text-slate-500"
            />
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            If you received a full invitation link (e.g. <code className="text-cyan-300">.../join/X7K29P#SECRET</code>), the decryption key will be extracted automatically from the URL fragment!
          </p>

          <button
            type="submit"
            disabled={!roomId.trim()}
            className="w-full py-3.5 px-4 rounded-xl font-semibold text-black bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>Enter Secure Room</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Clock, Users, ShieldCheck, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { roomApi } from '../services/roomApi';
import { generateEncryptionKey, exportKeyToString } from '../crypto/keyManager';

export default function CreateRoom() {
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [maxParticipants, setMaxParticipants] = useState(2);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      setIsCreating(true);
      setError(null);

      // Step 1: Generate 256-bit AES-GCM Encryption Key locally in Web Crypto API
      const cryptoKey = await generateEncryptionKey();
      const secretKeyString = await exportKeyToString(cryptoKey);

      // Step 2: Request backend to register room metadata (roomId, expiresAt, maxParticipants)
      const response = await roomApi.createRoom(durationMinutes, maxParticipants);

      if (response.success && response.room) {
        const { roomId } = response.room;
        // Step 3: Redirect to Room View carrying secret key ONLY in the URL fragment #KEY
        navigate(`/join/${roomId}#${secretKeyString}`);
      } else {
        throw new Error(response.error || 'Failed to create room.');
      }
    } catch (err) {
      console.error('[Create Room Error]:', err);
      setError(err.response?.data?.error || err.message || 'An error occurred while creating room.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 text-cyan-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Create Encrypted Room</h1>
            <p className="text-xs text-slate-400">Client-side key generation & zero-knowledge room initialization</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs font-mono text-rose-400 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreateRoom} className="space-y-6">
          {/* Expiration Duration Selector */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Room Expiration Duration</span>
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {[
                { label: '5 min', value: 5 },
                { label: '10 min', value: 10 },
                { label: '30 min', value: 30 },
                { label: '1 hour', value: 60 }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDurationMinutes(opt.value)}
                  className={`py-3 px-2 rounded-xl text-xs font-mono font-semibold transition-all border ${
                    durationMinutes === opt.value
                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              After expiration, all ciphertext blobs are automatically purged from server memory and database storage.
            </p>
          </div>

          {/* Participant Limit */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Max Participants Allowed</span>
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="2"
                max="10"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <span className="font-mono text-sm font-bold text-cyan-300 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 min-w-[3rem] text-center">
                {maxParticipants}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Recommended: 2 participants for direct 1-to-1 developer file transfer.
            </p>
          </div>

          {/* Security Banner */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Local Web Crypto API Promise</span>
            </div>
            <p>
              Clicking "Initialize Room" triggers your browser's Web Crypto engine to create a random 256-bit secret key. The key never touches the backend HTTP server.
            </p>
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="w-full py-3.5 px-4 rounded-xl font-semibold text-black bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Generating Cryptographic Key & Room...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Initialize Secure Room</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

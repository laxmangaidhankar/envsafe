import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export default function ExpiryTimer({ expiresAt, onExpire }) {
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0, totalSeconds: 0, isExpired: false });
  const [initialTotalSeconds, setInitialTotalSeconds] = useState(1);

  useEffect(() => {
    if (!expiresAt) return;

    const targetTime = new Date(expiresAt).getTime();
    const now = Date.now();
    const initialDiff = Math.max(0, Math.floor((targetTime - now) / 1000));
    setInitialTotalSeconds(initialDiff > 0 ? initialDiff : 1);

    const updateTimer = () => {
      const currentNow = Date.now();
      const diffSeconds = Math.max(0, Math.floor((targetTime - currentNow) / 1000));

      if (diffSeconds <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0, totalSeconds: 0, isExpired: true });
        if (onExpire) onExpire();
        return;
      }

      const minutes = Math.floor(diffSeconds / 60);
      const seconds = diffSeconds % 60;
      setTimeLeft({ minutes, seconds, totalSeconds: diffSeconds, isExpired: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (timeLeft.isExpired) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
        <AlertTriangle className="w-4 h-4 animate-bounce" />
        <span>ROOM EXPIRED — Files Destroyed</span>
      </div>
    );
  }

  const isLowTime = timeLeft.totalSeconds < 120; // Under 2 minutes
  const progressPercent = Math.min(100, Math.max(0, (timeLeft.totalSeconds / initialTotalSeconds) * 100));

  return (
    <div className="flex flex-col space-y-1.5">
      <div className="flex items-center justify-between space-x-3">
        <div className="flex items-center space-x-2">
          <Clock className={`w-4 h-4 ${isLowTime ? 'text-amber-400 animate-pulse' : 'text-cyan-400'}`} />
          <span className="text-xs text-slate-400 font-medium">Expires in:</span>
        </div>
        <span
          className={`font-mono text-sm font-bold ${
            isLowTime ? 'text-amber-400 animate-pulse' : 'text-cyan-300'
          }`}
        >
          {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </div>

      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isLowTime ? 'bg-amber-400' : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

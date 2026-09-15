import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import Room from './pages/Room';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 selection:bg-cyan-500 selection:text-black">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateRoom />} />
            <Route path="/join" element={<JoinRoom />} />
            <Route path="/join/:roomId" element={<Room />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="py-6 border-t border-slate-900 text-center text-xs font-mono text-slate-500 space-y-1">
          <p>CipherVault — E2EE Temporary Room Sharing Platform</p>
          <p className="text-[10px] text-slate-600">The server manages the room, but never knows the secret.</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}
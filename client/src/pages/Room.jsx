import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Lock,
  Copy,
  Check,
  Trash2,
  Users,
  UploadCloud,
  FileText,
  Code,
  Key,
  AlertTriangle,
  RefreshCw,
  Share2,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { roomApi } from '../services/roomApi';
import { importKeyFromString } from '../crypto/keyManager';
import { encryptData } from '../crypto/encryption';
import { connectRoomSocket } from '../services/socket';
import ExpiryTimer from '../components/ExpiryTimer';
import FileCard from '../components/FileCard';

export default function Room() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [files, setFiles] = useState([]);
  const [cryptoKey, setCryptoKey] = useState(null);
  const [keyString, setKeyString] = useState('');
  const [manualKeyInput, setManualKeyInput] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participantCount, setParticipantCount] = useState(1);
  const [isExpired, setIsExpired] = useState(false);
  const [isDestroyed, setIsDestroyed] = useState(false);

  // Copy Feedback States
  const [linkCopied, setLinkCopied] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);

  // Composer Form States
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'file'
  const [snippetName, setSnippetName] = useState('production.env');
  const [snippetText, setSnippetText] = useState('DATABASE_URL=mongodb://user:password@server\nJWT_SECRET=super-secret-key-123\nAPI_KEY=live_pk_99887766');
  const [fileType, setFileType] = useState('text'); // 'text' | 'code' | 'file'
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const cleanRoomId = roomId ? roomId.toUpperCase() : '';

  // Extract secret key from URL fragment #KEY or load from state
  useEffect(() => {
    const hash = location.hash.replace('#', '').trim();
    if (hash) {
      setKeyString(hash);
      importKeyFromString(hash)
        .then((imported) => setCryptoKey(imported))
        .catch((err) => {
          console.error('Failed to import key from URL hash fragment:', err);
          setError('Invalid encryption key in URL fragment.');
        });
    }
  }, [location.hash]);

  // Load Room Metadata and Ciphertext Files
  const fetchRoomData = useCallback(async () => {
    if (!cleanRoomId) return;

    try {
      setLoading(true);
      setError(null);

      const roomRes = await roomApi.getRoom(cleanRoomId);
      if (roomRes.success && roomRes.room) {
        setRoom(roomRes.room);
        if (roomRes.room.status === 'expired') {
          setIsExpired(true);
        } else if (roomRes.room.status === 'destroyed') {
          setIsDestroyed(true);
        }
      }

      const filesRes = await roomApi.getFiles(cleanRoomId);
      if (filesRes.success && filesRes.files) {
        setFiles(filesRes.files);
      }
    } catch (err) {
      console.error('[Fetch Room Error]:', err);
      const errMsg = err.response?.data?.error || err.message || 'Room not found or expired.';
      setError(errMsg);
      if (err.response?.status === 410) {
        setIsExpired(true);
      }
    } finally {
      setLoading(false);
    }
  }, [cleanRoomId]);

  useEffect(() => {
    fetchRoomData();
  }, [fetchRoomData]);

  // Socket.io Real-Time Event Subscription
  useEffect(() => {
    if (!cleanRoomId || isExpired || isDestroyed) return;

    const cleanupSocket = connectRoomSocket(cleanRoomId, {
      onRoomJoined: ({ participantCount: count }) => {
        if (count) setParticipantCount(count);
      },
      onParticipantLeft: ({ participantCount: count }) => {
        if (count) setParticipantCount(count);
      },
      onFileAdded: ({ file }) => {
        setFiles((prev) => {
          if (prev.some((f) => f._id === file._id)) return prev;
          return [file, ...prev];
        });
      },
      onFileDeleted: ({ fileId }) => {
        setFiles((prev) => prev.filter((f) => f._id !== fileId));
      },
      onRoomExpired: () => {
        setIsExpired(true);
        setFiles([]);
      },
      onRoomDestroyed: () => {
        setIsDestroyed(true);
        setFiles([]);
      }
    });

    return () => {
      cleanupSocket();
    };
  }, [cleanRoomId, isExpired, isDestroyed]);

  // Handle Manual Key Import if #KEY fragment was missing
  const handleManualKeySubmit = async (e) => {
    e.preventDefault();
    if (!manualKeyInput.trim()) return;

    try {
      const cleanKey = manualKeyInput.trim();
      const imported = await importKeyFromString(cleanKey);
      setCryptoKey(imported);
      setKeyString(cleanKey);
      navigate(`#${cleanKey}`, { replace: true });
    } catch (err) {
      console.error('Manual key import failed:', err);
      alert('Invalid secret key format. Please verify key string.');
    }
  };

  // Upload Encrypted Text / Code Snippet
  const handleUploadSnippet = async (e) => {
    e.preventDefault();
    if (!cryptoKey) {
      alert('Missing encryption key. Cannot encrypt content.');
      return;
    }
    if (!snippetText.trim()) return;

    try {
      setIsUploading(true);
      setUploadError(null);

      // Client-side Web Crypto AES-256-GCM Encryption
      const encrypted = await encryptData(snippetText, cryptoKey);

      const payload = {
        fileName: snippetName.trim() || 'secret.env',
        mimeType: 'text/plain',
        size: new Blob([snippetText]).size,
        fileType: fileType,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv
      };

      const res = await roomApi.uploadFile(cleanRoomId, payload);
      if (res.success && res.file) {
        setFiles((prev) => [res.file, ...prev]);
        setSnippetText('');
      }
    } catch (err) {
      console.error('[Upload Snippet Error]:', err);
      setUploadError(err.response?.data?.error || err.message || 'Failed to upload snippet.');
    } finally {
      setIsUploading(false);
    }
  };

  // Upload Encrypted File
  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!cryptoKey) {
      alert('Missing encryption key. Cannot encrypt file.');
      return;
    }
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadError(null);

      const arrayBuffer = await selectedFile.arrayBuffer();
      // Client-side Web Crypto AES-256-GCM Encryption
      const encrypted = await encryptData(arrayBuffer, cryptoKey);

      const payload = {
        fileName: selectedFile.name,
        mimeType: selectedFile.type || 'application/octet-stream',
        size: selectedFile.size,
        fileType: 'file',
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv
      };

      const res = await roomApi.uploadFile(cleanRoomId, payload);
      if (res.success && res.file) {
        setFiles((prev) => [res.file, ...prev]);
        setSelectedFile(null);
      }
    } catch (err) {
      console.error('[Upload File Error]:', err);
      setUploadError(err.response?.data?.error || err.message || 'Failed to upload file.');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Shared File
  const handleDeleteFile = async (fileId) => {
    try {
      await roomApi.deleteFile(cleanRoomId, fileId);
      setFiles((prev) => prev.filter((f) => f._id !== fileId));
    } catch (err) {
      console.error('[Delete File Error]:', err);
      alert('Failed to delete file.');
    }
  };

  // Destroy Room
  const handleDestroyRoom = async () => {
    if (!window.confirm('Are you sure you want to destroy this room immediately? All shared files will be permanently erased.')) {
      return;
    }

    try {
      await roomApi.destroyRoom(cleanRoomId);
      setIsDestroyed(true);
      setFiles([]);
    } catch (err) {
      console.error('[Destroy Room Error]:', err);
      alert('Failed to destroy room.');
    }
  };

  const copyFullShareLink = async () => {
    const fullLink = `${window.location.origin}/join/${cleanRoomId}#${keyString}`;
    try {
      await navigator.clipboard.writeText(fullLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy share link:', err);
    }
  };

  const copyKeyOnly = async () => {
    try {
      await navigator.clipboard.writeText(keyString);
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy key:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono text-cyan-400">Verifying zero-knowledge room credentials...</p>
      </div>
    );
  }

  if (error || isExpired || isDestroyed) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="glass-panel rounded-2xl p-8 border border-rose-900/50 text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              {isDestroyed ? 'Room Destroyed' : isExpired ? 'Room Expired' : 'Access Restricted'}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
              {isDestroyed
                ? 'This room was manually destroyed by the creator. All encrypted ciphertext blobs have been permanently erased from database storage.'
                : isExpired
                ? 'The room expiration timer reached 0. Background cleanup workers have purged all associated ciphertext blobs.'
                : error}
            </p>
          </div>
          <button
            onClick={() => navigate('/create')}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-black bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-lg text-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Secure Room</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Missing Key Prompt Modal */}
      {!cryptoKey && (
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 to-slate-900 shadow-2xl space-y-4">
          <div className="flex items-start space-x-3">
            <Key className="w-5 h-5 text-cyan-400 shrink-0 mt-1" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Decryption Key Required
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                You opened room <span className="font-mono text-cyan-300 font-bold">{cleanRoomId}</span> without the secret fragment. Enter the decryption key to view and share secrets.
              </p>
            </div>
          </div>
          <form onSubmit={handleManualKeySubmit} className="flex gap-2">
            <input
              type="password"
              placeholder="Paste Base64URL Secret Key"
              value={manualKeyInput}
              onChange={(e) => setManualKeyInput(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-colors"
            >
              Unlock Room
            </button>
          </form>
        </div>
      )}

      {/* Header Bar */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <span className="text-xs text-slate-400 font-mono">ROOM CODE:</span>
              <span className="font-mono text-2xl font-black text-white tracking-wider px-3 py-1 rounded-xl bg-slate-900 border border-slate-700/80">
                {cleanRoomId}
              </span>
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-xs font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>AES-256-GCM E2EE</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Live Participant Counter */}
            <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Participants:</span>
              <span className="text-cyan-400 font-bold">{participantCount}</span>
              <span className="text-slate-500">/ {room?.maxParticipants || 2}</span>
            </div>

            {/* Live Countdown Timer */}
            {room?.expiresAt && (
              <div className="px-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 min-w-[180px]">
                <ExpiryTimer expiresAt={room.expiresAt} onExpire={() => setIsExpired(true)} />
              </div>
            )}
          </div>
        </div>

        {/* Share & Control Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={copyFullShareLink}
              disabled={!keyString}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-800/60 text-cyan-300 text-xs font-semibold transition-all shadow-md shadow-cyan-500/10 disabled:opacity-50"
            >
              {linkCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{linkCopied ? 'Link Copied to Clipboard!' : 'Copy Shareable Room Link'}</span>
            </button>

            <button
              onClick={copyKeyOnly}
              disabled={!keyString}
              className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-colors disabled:opacity-50"
            >
              {keyCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Key className="w-4 h-4 text-cyan-400" />}
              <span>{keyCopied ? 'Key Copied!' : 'Copy Secret Key'}</span>
            </button>
          </div>

          <button
            onClick={handleDestroyRoom}
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/60 text-rose-400 text-xs font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Destroy Room Now</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Client Encryption Composer */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Encrypt & Share Secret
              </h2>
              <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('text')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    activeTab === 'text' ? 'bg-cyan-500 text-black font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Text / .env
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('file')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    activeTab === 'file' ? 'bg-cyan-500 text-black font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  File Upload
                </button>
              </div>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs font-mono text-rose-400">
                {uploadError}
              </div>
            )}

            {activeTab === 'text' ? (
              <form onSubmit={handleUploadSnippet} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">File Name / Label</label>
                  <input
                    type="text"
                    required
                    value={snippetName}
                    onChange={(e) => setSnippetName(e.target.value)}
                    placeholder="e.g. production.env or config.json"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Secret Plaintext Content</label>
                  <textarea
                    rows={8}
                    required
                    value={snippetText}
                    onChange={(e) => setSnippetText(e.target.value)}
                    placeholder="Paste .env parameters, API keys, or code snippets here..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-cyan-500 leading-relaxed selection:bg-cyan-500 selection:text-black"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUploading || !cryptoKey}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-black bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-md text-xs transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isUploading ? (
                    <span>Encrypting in Web Crypto API...</span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Encrypt & Send to Room</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleUploadFile} className="space-y-4">
                <div className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 text-center space-y-3 bg-slate-950/40 transition-colors">
                  <UploadCloud className="w-8 h-8 text-cyan-400 mx-auto" />
                  <div>
                    <p className="text-xs text-slate-300 font-medium">
                      Select file to encrypt (<code className="text-cyan-300">.env</code>, <code className="text-cyan-300">json</code>, <code className="text-cyan-300">pem</code>, <code className="text-cyan-300">yaml</code>)
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">Maximum file size: 10 MB</p>
                  </div>
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                    className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-950 file:text-cyan-300 hover:file:bg-cyan-900 cursor-pointer"
                  />
                </div>

                {selectedFile && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-between">
                    <span className="truncate">{selectedFile.name}</span>
                    <span className="text-cyan-400 font-bold">{Math.round(selectedFile.size / 1024)} KB</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isUploading || !selectedFile || !cryptoKey}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-black bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-md text-xs transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isUploading ? (
                    <span>Encrypting Binary Payload...</span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Encrypt & Upload File</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Encrypted Files Feed */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center space-x-2">
              <span>Shared Room Secrets</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 text-xs font-bold">
                {files.length}
              </span>
            </h2>

            <button
              onClick={fetchRoomData}
              title="Refresh files"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {files.length === 0 ? (
            <div className="glass-panel rounded-2xl p-10 text-center space-y-3 border border-slate-800">
              <Lock className="w-8 h-8 text-slate-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-300">No encrypted files in this room yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Use the composer on the left to encrypt and share your first <code className="text-cyan-400">.env</code> file or secret text.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {files.map((file) => (
                <FileCard
                  key={file._id}
                  file={file}
                  cryptoKey={cryptoKey}
                  onDelete={handleDeleteFile}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

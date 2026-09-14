import React, { useState, useEffect } from 'react';
import {
  FileText,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  Download,
  Trash2,
  AlertCircle,
  Code,
  FileCode
} from 'lucide-react';
import { decryptData } from '../crypto/decryption';

export default function FileCard({ file, cryptoKey, onDelete }) {
  const [decryptedContent, setDecryptedContent] = useState(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState(null);
  const [showMasked, setShowMasked] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const performDecryption = async () => {
      if (!cryptoKey) return;

      try {
        setIsDecrypting(true);
        setDecryptError(null);

        const plaintext = await decryptData(
          { ciphertext: file.ciphertext, iv: file.iv },
          cryptoKey,
          'string'
        );

        if (isMounted) {
          setDecryptedContent(plaintext);
        }
      } catch (err) {
        console.error('[Client Decryption Error]:', err);
        if (isMounted) {
          setDecryptError('Decryption failed. Incorrect or missing encryption key.');
        }
      } finally {
        if (isMounted) {
          setIsDecrypting(false);
        }
      }
    };

    performDecryption();

    return () => {
      isMounted = false;
    };
  }, [file.ciphertext, file.iv, cryptoKey]);

  const handleCopySecret = async () => {
    if (!decryptedContent) return;
    try {
      await navigator.clipboard.writeText(decryptedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleDownload = () => {
    if (!decryptedContent) return;

    const blob = new Blob([decryptedContent], { type: file.mimeType || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.fileName || 'secret.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    if (file.fileName.endsWith('.env') || file.fileType === 'text') {
      return <FileText className="w-5 h-5 text-emerald-400" />;
    }
    if (file.fileType === 'code' || file.fileName.endsWith('.json') || file.fileName.endsWith('.yaml')) {
      return <FileCode className="w-5 h-5 text-cyan-400" />;
    }
    return <Code className="w-5 h-5 text-indigo-400" />;
  };

  return (
    <div className="glass-card rounded-xl p-4 border border-slate-800 hover:border-slate-700/80 transition-all duration-200 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 mt-0.5">
            {getFileIcon()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-mono text-sm font-semibold text-slate-100 break-all">
                {file.fileName}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 uppercase">
                AES-256-GCM
              </span>
            </div>
            <div className="flex items-center space-x-3 mt-1 text-xs text-slate-400">
              <span>{formatFileSize(file.size)}</span>
              <span>•</span>
              <span>{new Date(file.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 self-end md:self-center">
          {decryptedContent && (
            <>
              <button
                onClick={() => setShowMasked(!showMasked)}
                title={showMasked ? 'Reveal secret' : 'Mask secret'}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors border border-slate-700/50"
              >
                {showMasked ? <Eye className="w-4 h-4 text-cyan-400" /> : <EyeOff className="w-4 h-4 text-cyan-400" />}
              </button>

              <button
                onClick={handleCopySecret}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/60 text-cyan-300 text-xs font-medium transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Secret'}</span>
              </button>

              <button
                onClick={handleDownload}
                title="Download decrypted file"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 text-slate-200 text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </button>
            </>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(file._id)}
              title="Delete secret"
              className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 border border-rose-900/50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Decrypted Payload Preview / Masked View */}
      {isDecrypting ? (
        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono text-cyan-400 flex items-center space-x-2">
          <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>Decrypting payload client-side with AES-256-GCM...</span>
        </div>
      ) : decryptError ? (
        <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-xs font-mono text-rose-400 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{decryptError}</span>
        </div>
      ) : decryptedContent ? (
        <div className="relative mt-2">
          <pre className="p-3 rounded-lg bg-[#060911] border border-slate-800/80 font-mono text-xs text-slate-200 overflow-x-auto max-h-56 leading-relaxed selection:bg-cyan-500 selection:text-black">
            {showMasked
              ? decryptedContent
                  .split('\n')
                  .map((line) => {
                    if (line.includes('=')) {
                      const [key] = line.split('=');
                      return `${key}=••••••••••••••••`;
                    }
                    return '••••••••••••••••••••••••';
                  })
                  .join('\n')
              : decryptedContent}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cloud, 
  ExternalLink, 
  Check, 
  RotateCw, 
  AlertCircle, 
  Database, 
  ShieldCheck,
  Terminal,
  Copy
} from 'lucide-react';
import { 
  getSavedAppsScriptUrl, 
  saveAppsScriptUrl 
} from '../../lib/storage';
import { 
  testSheetsConnection, 
  isLiveSheetsConnected 
} from '../../services/sheetsSync';

interface CloudConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

export const CloudConfigModal: React.FC<CloudConfigModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const [url, setUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUrl(getSavedAppsScriptUrl());
      setTestResult(null);
      setIsSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testSheetsConnection(url);
      setTestResult(result);
      if (result.success) {
        saveAppsScriptUrl(url);
        setIsSaved(true);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    saveAppsScriptUrl(url);
    setIsSaved(true);
    setTimeout(() => {
      onRefreshData();
      onClose();
    }, 600);
  };

  const spreadsheetUrl = "https://docs.google.com/spreadsheets/d/16D1TXnUvGxPhp6YDwq9l0rCoBXnTwsDAHOe-0Z5uu1k/edit#gid=1624538793";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-void/85 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative bg-surface border border-surface-border rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-nexus-lg z-10 text-xs">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-center">
              <Database className="w-5 h-5 text-nexus-electric" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-pure font-mono">
                Google Sheets Backend Engine
              </h3>
              <p className="text-xs font-mono text-text-muted">
                Centralized Single Source of Truth (`Technical_Support_DB`)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-surface-elevated transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Spreadsheet Link Banner */}
        <div className="p-3.5 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-between">
          <div className="space-y-0.5 font-mono">
            <span className="text-[10px] uppercase text-text-faint">Linked Spreadsheet ID</span>
            <p className="font-bold text-text-pure truncate max-w-xs">
              16D1TXnUvGxPhp6YDwq9l0rCoBXnTwsDAHOe-0Z5uu1k
            </p>
          </div>
          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-surface-border text-nexus-electric hover:text-white font-mono text-[11px] flex items-center gap-1.5 transition"
          >
            <span>Open Sheet</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Web App URL Input */}
        <div className="space-y-2 font-mono">
          <label className="block uppercase text-text-faint">
            Apps Script Web App Executable URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="flex-1 bg-surface-elevated text-text-pure rounded-xl border border-surface-border px-3 py-2 text-xs focus:border-nexus-electric focus:outline-none placeholder:text-text-faint font-mono"
            />
            <button
              onClick={handleTest}
              disabled={isTesting || !url.trim()}
              className="px-3.5 py-2 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-surface-border text-text-muted hover:text-white font-mono text-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {isTesting ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin text-nexus-electric" />
              ) : (
                <Cloud className="w-3.5 h-3.5 text-nexus-electric" />
              )}
              Test
            </button>
          </div>
          <p className="text-[10px] text-text-faint leading-relaxed">
            Deploy the Apps Script located in <code className="text-text-muted">google-apps-script/Code.gs</code> as a Web App with access set to "Anyone" and paste the execution URL here.
          </p>
        </div>

        {/* Test Result Indicator */}
        {testResult && (
          <div 
            className={`p-3 rounded-xl border font-mono text-xs flex items-center gap-2 ${
              testResult.success 
                ? 'bg-nexus/10 border-nexus/30 text-nexus-electric' 
                : 'bg-surface-elevated border-surface-border text-text-muted'
            }`}
          >
            {testResult.success ? (
              <Check className="w-4 h-4 text-nexus-electric" />
            ) : (
              <AlertCircle className="w-4 h-4 text-text-muted" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Deployment Instructions Box */}
        <div className="p-3 bg-surface-elevated/70 border border-surface-border rounded-xl space-y-1.5 font-mono text-[11px] text-text-muted">
          <div className="text-text-pure font-bold flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-nexus-electric" />
            Zero Duplicate Guarantee & Dual-Mode
          </div>
          <p className="leading-relaxed">
            When configured, all ticket submissions, stopwatch start times, and resolution logs push synchronously to Google Sheets while maintaining local persistence. If offline or unconfigured, the app falls back seamlessly to local state with zero data loss.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-surface-border">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-text-faint">
            <span className={`w-2 h-2 rounded-full ${isLiveSheetsConnected() ? 'bg-nexus-electric animate-ping' : 'bg-surface-border'}`} />
            <span>{isLiveSheetsConnected() ? 'Live Sheets Connected' : 'Local Storage Mode'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-surface-border text-text-muted hover:text-white font-mono transition"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-nexus hover:bg-nexus-dark text-white font-mono font-bold flex items-center gap-1.5 shadow-nexus-sm transition"
            >
              <Check className="w-3.5 h-3.5" />
              Save Configuration
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

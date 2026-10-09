import React, { useState } from 'react';
import { 
  X, 
  Cloud, 
  Database, 
  Check, 
  RotateCw, 
  AlertCircle, 
  ExternalLink,
  Plus,
  Download,
  Terminal
} from 'lucide-react';
import { 
  getSavedAppsScriptUrl, 
  saveAppsScriptUrl, 
  getSavedSpreadsheetUrl, 
  saveSpreadsheetUrl 
} from '../../lib/storage';
import { testSheetsConnection, isLiveSheetsConnected } from '../../services/sheetsSync';

interface CloudConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
  onSaved?: () => void;
}

export const CloudConfigModal: React.FC<CloudConfigModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
  onSaved,
}) => {
  const [url, setUrl] = useState(getSavedAppsScriptUrl());
  const [sheetUrl, setSheetUrl] = useState(getSavedSpreadsheetUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!url.trim()) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSheetsConnection(url.trim());
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    saveAppsScriptUrl(url.trim());
    saveSpreadsheetUrl(sheetUrl.trim());
    onRefreshData?.();
    onSaved?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative bg-surface border border-surface-border rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl z-10 text-xs">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-pure">
                Google Sheets Backend Engine
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Centralized Single Source of Truth (<code className="font-mono text-indigo-600 dark:text-indigo-400">Technical_Support_DB</code>)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-pure hover:bg-surface-elevated transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <a
            href="https://sheets.new"
            target="_blank"
            rel="noreferrer"
            className="p-3 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-surface-border text-text-pure text-xs flex items-center justify-between transition group"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div className="text-left">
                <span className="font-semibold block">Create New Sheet</span>
                <span className="text-[11px] text-text-muted">Opens sheets.new in Drive</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
          </a>

          <a
            href="./Digital_Azadi_Support_Master_DB_Template.csv"
            download="Digital_Azadi_Support_Master_DB_Template.csv"
            className="p-3 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-surface-border text-text-pure text-xs flex items-center justify-between transition group"
          >
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <div className="text-left">
                <span className="font-semibold block">Download Template CSV</span>
                <span className="text-[11px] text-text-muted">All 16 columns formatted</span>
              </div>
            </div>
            <Download className="w-3.5 h-3.5 text-text-muted" />
          </a>
        </div>

        {/* Spreadsheet URL Input */}
        <div className="p-3.5 rounded-xl bg-surface-elevated border border-surface-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted">Connected Google Spreadsheet URL / ID</span>
            {sheetUrl && (
              <a
                href={sheetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 dark:text-indigo-400 hover:underline text-xs inline-flex items-center gap-1 font-medium"
              >
                <span>Open Current Sheet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <input
            type="text"
            value={sheetUrl}
            onChange={e => setSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/.../edit"
            className="w-full bg-surface text-text-pure rounded-xl border border-surface-border px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none placeholder:text-text-faint font-mono"
          />
        </div>

        {/* Web App URL Input */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-text-muted">
            Apps Script Web App Executable URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="flex-1 bg-surface-elevated text-text-pure rounded-xl border border-surface-border px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none placeholder:text-text-faint font-mono"
            />
            <button
              onClick={handleTest}
              disabled={isTesting || !url.trim()}
              className="px-3.5 py-2 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-surface-border text-text-soft hover:text-text-pure text-xs flex items-center gap-1.5 transition disabled:opacity-50 font-medium"
            >
              {isTesting ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
              ) : (
                <Cloud className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              )}
              Test
            </button>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Deploy the Apps Script located in <code className="text-text-pure font-mono">google-apps-script/Code.gs</code> as a Web App with access set to "Anyone" and paste the execution URL here.
          </p>
        </div>

        {/* Test Result Indicator */}
        {testResult && (
          <div 
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              testResult.success 
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
                : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
            }`}
          >
            {testResult.success ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Deployment Instructions Box */}
        <div className="p-3 bg-surface-elevated border border-surface-border rounded-xl space-y-1.5 text-xs text-text-muted">
          <div className="text-text-pure font-semibold flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Zero Duplicate Guarantee & Dual-Mode
          </div>
          <p className="leading-relaxed">
            When configured, all ticket submissions, stopwatch start times, and resolution logs push synchronously to Google Sheets while maintaining local persistence. If offline, the app falls back seamlessly to local state with zero data loss.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-surface-border">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <span className={`w-2 h-2 rounded-full ${isLiveSheetsConnected() ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>{isLiveSheetsConnected() ? 'Live Sheets Connected' : 'Local Storage Mode'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-surface-border text-text-soft hover:text-text-pure transition font-medium"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-sm transition"
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

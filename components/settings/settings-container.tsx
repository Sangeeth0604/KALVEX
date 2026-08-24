"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useTheme } from "@/components/theme/theme-provider";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { historyManager } from "@/lib/history";
import { workflowManager } from "@/lib/workflows/workflow-manager";
import { documentBus } from "@/lib/document-bus";

const emptySubscribe = () => () => {};

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function SettingsContainer() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const [historyCount, setHistoryCount] = useState(() => historyManager.getEntries().length);
  const [workflowCount, setWorkflowCount] = useState(() => workflowManager.getWorkflows().length);
  const [activeArtifactsCount, setActiveArtifactsCount] = useState(() => documentBus.listArtifacts().length);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Preference states stored in localStorage with lazy initializers
  const [imgQuality, setImgQuality] = useState<string>(() => {
    if (typeof window === "undefined") return "85";
    try {
      return localStorage.getItem("kalvex_pref_img_quality") || "85";
    } catch {
      return "85";
    }
  });

  const [pdfProfile, setPdfProfile] = useState<string>(() => {
    if (typeof window === "undefined") return "balanced";
    try {
      return localStorage.getItem("kalvex_pref_pdf_profile") || "balanced";
    } catch {
      return "balanced";
    }
  });

  const [ocrLang, setOcrLang] = useState<string>(() => {
    if (typeof window === "undefined") return "eng";
    try {
      return localStorage.getItem("kalvex_pref_ocr_lang") || "eng";
    } catch {
      return "eng";
    }
  });

  const handleSavePreferences = () => {
    try {
      localStorage.setItem("kalvex_pref_img_quality", imgQuality);
      localStorage.setItem("kalvex_pref_pdf_profile", pdfProfile);
      localStorage.setItem("kalvex_pref_ocr_lang", ocrLang);
      setSaveSuccessNotice("Processing preferences saved to browser storage.");
      setTimeout(() => setSaveSuccessNotice(null), 3000);
    } catch {
      setSaveSuccessNotice("Failed to persist preferences to localStorage.");
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your local operation history?")) {
      historyManager.clearHistory();
      setHistoryCount(0);
    }
  };

  const handleClearDocumentBus = () => {
    documentBus.clearAll();
    setActiveArtifactsCount(0);
    setSaveSuccessNotice("In-memory Document Bus cache cleared.");
    setTimeout(() => setSaveSuccessNotice(null), 3000);
  };

  const handleResetWorkflows = () => {
    if (window.confirm("Reset all saved workflows back to default factory templates?")) {
      workflowManager.resetToDefaults();
      setWorkflowCount(workflowManager.getWorkflows().length);
      setSaveSuccessNotice("Workflows reset to default templates.");
      setTimeout(() => setSaveSuccessNotice(null), 3000);
    }
  };

  const handleExportData = () => {
    const data = {
      app: "KALVEX",
      version: "1.0.0-beta",
      exportedAt: new Date().toISOString(),
      history: historyManager.getEntries(),
      workflows: workflowManager.getWorkflows(),
      preferences: {
        theme,
        imgQuality,
        pdfProfile,
        ocrLang,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kalvex-workspace-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!mounted) {
    return (
      <div className="py-12 text-center font-mono text-xs text-text-muted">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="py-8 pb-24">
      <Container size="xl" className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant="accent" size="sm" dot>
                Platform Preferences
              </Badge>
              <span className="text-xs font-mono text-text-muted bg-surface-raised px-2.5 py-0.5 rounded border border-border-subtle">
                In-Browser Configuration
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">
              Workspace Settings
            </h1>
            <p className="text-sm text-text-secondary mt-1 max-w-2xl">
              Configure appearance, privacy controls, processing defaults, and manage local data stored in this browser.
            </p>
          </div>

          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="font-mono text-xs cursor-pointer">
              ➔ Back to Dashboard
            </Button>
          </Link>
        </div>

        {saveSuccessNotice && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 font-mono text-xs flex items-center justify-between animate-in fade-in">
            <span>✓ {saveSuccessNotice}</span>
            <button onClick={() => setSaveSuccessNotice(null)} className="text-green-400 font-bold cursor-pointer">✕</button>
          </div>
        )}

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 1: Appearance & Theme */}
          <div className="p-6 rounded-xl border border-border-default bg-surface-base shadow-card space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
              <span className="text-lg">🎨</span>
              <h3 className="text-base font-bold text-text-primary">Appearance & Theme</h3>
            </div>
            <p className="text-xs text-text-secondary">
              Select your visual preference. KALVEX defaults to dark mode with electric green accents.
            </p>
            <div className="grid grid-cols-3 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-3 rounded-lg border font-mono text-xs flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                  theme === "dark"
                    ? "bg-accent/10 border-accent text-accent font-bold"
                    : "bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary"
                }`}
              >
                <span>🌙 Dark</span>
                <span className="text-[10px] opacity-70">Default</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-3 rounded-lg border font-mono text-xs flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                  theme === "light"
                    ? "bg-accent/10 border-accent text-accent font-bold"
                    : "bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary"
                }`}
              >
                <span>☀️ Light</span>
                <span className="text-[10px] opacity-70">Clean</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`p-3 rounded-lg border font-mono text-xs flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                  theme === "system"
                    ? "bg-accent/10 border-accent text-accent font-bold"
                    : "bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary"
                }`}
              >
                <span>💻 System</span>
                <span className="text-[10px] opacity-70">Auto</span>
              </button>
            </div>
          </div>

          {/* Section 2: Privacy & Memory Cache */}
          <div className="p-6 rounded-xl border border-border-default bg-surface-base shadow-card space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
              <span className="text-lg">🔒</span>
              <h3 className="text-base font-bold text-text-primary">Privacy & Memory Bus</h3>
            </div>
            <p className="text-xs text-text-secondary">
              KALVEX processes files inside your browser RAM. No files or text are retained on remote servers.
            </p>
            <div className="space-y-3 pt-2 font-mono text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-raised border border-border-subtle">
                <span className="text-text-muted">Active RAM Artifacts:</span>
                <span className="font-bold text-accent">{activeArtifactsCount} cached in session</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearDocumentBus}
                className="w-full font-mono text-xs cursor-pointer text-text-muted hover:text-text-primary"
              >
                Flush In-Memory Document Bus Cache
              </Button>
            </div>
          </div>

          {/* Section 3: Processing Preferences */}
          <div className="p-6 rounded-xl border border-border-default bg-surface-base shadow-card space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
              <span className="text-lg">⚙️</span>
              <h3 className="text-base font-bold text-text-primary">Tool Processing Defaults</h3>
            </div>
            <p className="text-xs text-text-secondary">
              Set default parameters applied when loading tools.
            </p>

            <div className="space-y-3 pt-2 font-mono text-xs">
              <div>
                <label className="block text-text-muted mb-1">Default JPEG Compression Quality</label>
                <select
                  value={imgQuality}
                  onChange={(e) => setImgQuality(e.target.value)}
                  className="w-full p-2 bg-surface-raised border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="90">90% — Maximum Visual Fidelity</option>
                  <option value="85">85% — Balanced (Recommended)</option>
                  <option value="75">75% — Aggressive Compression</option>
                </select>
              </div>

              <div>
                <label className="block text-text-muted mb-1">Default PDF Optimizer Profile</label>
                <select
                  value={pdfProfile}
                  onChange={(e) => setPdfProfile(e.target.value)}
                  className="w-full p-2 bg-surface-raised border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="balanced">Balanced Web Optimization</option>
                  <option value="lossless">Strict Lossless Stream Shrink</option>
                </select>
              </div>

              <div>
                <label className="block text-text-muted mb-1">Default WASM OCR Language</label>
                <select
                  value={ocrLang}
                  onChange={(e) => setOcrLang(e.target.value)}
                  className="w-full p-2 bg-surface-raised border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="eng">English (eng)</option>
                  <option value="spa">Spanish (spa)</option>
                  <option value="deu">German (deu)</option>
                  <option value="fra">French (fra)</option>
                </select>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSavePreferences}
                className="w-full font-mono text-xs font-bold cursor-pointer mt-2"
              >
                Save Preferences
              </Button>
            </div>
          </div>

          {/* Section 4: Data Management & Backup */}
          <div className="p-6 rounded-xl border border-border-default bg-surface-base shadow-card space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
              <span className="text-lg">💾</span>
              <h3 className="text-base font-bold text-text-primary">Data Management & Backup</h3>
            </div>
            <p className="text-xs text-text-secondary">
              Export or reset your browser-stored activity history and custom saved pipelines.
            </p>

            <div className="space-y-3 pt-2 font-mono text-xs">
              <div className="p-3 rounded-lg bg-surface-raised border border-border-subtle space-y-1">
                <div className="flex justify-between">
                  <span className="text-text-muted">History Log Entries:</span>
                  <span className="font-bold text-text-primary">{historyCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Saved Workflows:</span>
                  <span className="font-bold text-text-primary">{workflowCount}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportData}
                  className="font-mono text-xs cursor-pointer"
                >
                  📥 Export Backup JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetWorkflows}
                  className="font-mono text-xs cursor-pointer text-text-muted hover:text-text-primary"
                >
                  🔄 Reset Workflows
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleClearHistory}
                className="w-full font-mono text-xs cursor-pointer text-error border-error/30 hover:bg-error/10"
              >
                Clear All Operation History
              </Button>
            </div>
          </div>
        </div>

        {/* Plan Information Card */}
        <div className="p-6 rounded-xl border border-border-subtle bg-surface-raised/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
          <div>
            <span className="text-accent font-bold uppercase">Plan Status: Public Beta Tier</span>
            <p className="text-text-muted mt-0.5">
              Enjoy unlimited client-side processing across all 12 tools and custom workflows.
            </p>
          </div>
          <Link href="/pricing">
            <Button variant="secondary" size="sm" className="font-mono text-xs cursor-pointer shrink-0">
              View Pricing Overview ➔
            </Button>
          </Link>
        </div>
      </Container>
    </div>
  );
}

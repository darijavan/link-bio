"use client";

import { useState, useTransition } from "react";

interface Props {
  username: string;
  initialTriggerPhrase: string;
  initialHeaderText: string | null;
  lastSyncedAt: string | null;
}

export function DashboardClient({
  username,
  initialTriggerPhrase,
  initialHeaderText,
  lastSyncedAt,
}: Props) {
  const [triggerPhrase, setTriggerPhrase] = useState(initialTriggerPhrase);
  const [headerText, setHeaderText] = useState(initialHeaderText ?? "");
  const [saved, setSaved] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{ synced: number; updatedAt: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const canSaveSettings = Boolean(triggerPhrase.trim()) && headerText.trim().length <= 80;

  async function saveSettings() {
    setSettingsError(null);
    const res = await fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ triggerPhrase, headerText }),
    });
    if (res.ok) {
      const data = await res.json();
      setTriggerPhrase(data.triggerPhrase);
      setHeaderText(data.headerText ?? "");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      const data = await res.json().catch(() => null);
      setSettingsError(data?.error ?? "Could not save settings");
    }
  }

  function handleSync() {
    startTransition(async () => {
      setSyncResult(null);
      const res = await fetch("/api/sync", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setSyncResult(data);
      }
    });
  }

  const pageUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${username}`
    : `https://yoursite.com/${username}`;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Your page</h2>
        <p className="font-mono text-sm bg-gray-100 rounded px-3 py-2 break-all">{pageUrl}</p>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Settings</h2>
        <div className="space-y-5">
          <label className="block">
            <span className="block text-sm font-medium text-gray-800 mb-1">Header text</span>
            <input
              type="text"
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              maxLength={80}
              placeholder={`@${username}`}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            <span className="mt-1 block text-xs text-gray-500">{headerText.trim().length}/80</span>
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-gray-800 mb-1">Trigger phrase</span>
            <span className="block text-sm text-gray-600 mb-2">
              Posts whose caption contains this phrase will appear on your page.
            </span>
            <input
              type="text"
              value={triggerPhrase}
              onChange={(e) => setTriggerPhrase(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </label>

          {settingsError && <p className="text-sm text-red-600">{settingsError}</p>}

          <button
            onClick={saveSettings}
            disabled={!canSaveSettings}
            className="px-4 py-2 bg-black text-white text-sm rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {saved ? "Saved!" : "Save settings"}
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Sync</h2>
        {lastSyncedAt && (
          <p className="text-sm text-gray-600 mb-3">
            Last synced: {new Date(lastSyncedAt).toLocaleString()}
          </p>
        )}
        {syncResult && (
          <p className="text-sm text-green-600 mb-3">
            Synced {syncResult.synced} post{syncResult.synced !== 1 ? "s" : ""} at{" "}
            {new Date(syncResult.updatedAt).toLocaleTimeString()}
          </p>
        )}
        <button
          onClick={handleSync}
          disabled={isPending}
          className="px-4 py-2 bg-black text-white text-sm rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {isPending ? "Syncing…" : "Sync now"}
        </button>
      </section>
    </div>
  );
}

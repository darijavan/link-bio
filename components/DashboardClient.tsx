"use client";

import { useState, useTransition } from "react";

interface Props {
  username: string;
  initialTriggerPhrase: string;
  lastSyncedAt: string | null;
}

export function DashboardClient({ username, initialTriggerPhrase, lastSyncedAt }: Props) {
  const [triggerPhrase, setTriggerPhrase] = useState(initialTriggerPhrase);
  const [saved, setSaved] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number; updatedAt: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  async function saveTriggerPhrase() {
    const res = await fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ triggerPhrase }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
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
    ? window.location.host.replace(/^app\./, `${username}.`)
    : `${username}.yoursite.com`;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Your page</h2>
        <p className="font-mono text-sm bg-gray-100 rounded px-3 py-2 break-all">{pageUrl}</p>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Trigger phrase
        </h2>
        <p className="text-sm text-gray-600 mb-3">
          Posts whose caption contains this phrase will appear on your page.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={triggerPhrase}
            onChange={(e) => setTriggerPhrase(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button
            onClick={saveTriggerPhrase}
            disabled={!triggerPhrase.trim()}
            className="px-4 py-2 bg-black text-white text-sm rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {saved ? "Saved!" : "Save"}
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

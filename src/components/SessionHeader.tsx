"use client";

import { useState } from "react";

export interface Session {
  id: number;
  session_name: string;
  access_ts: string;
}

interface SessionHeaderProps {
  userEmail: string;
  sessions: Session[];
  activeSessionId: number | null;
  onSelectSession: (id: number) => void;
  onCreateSession: (name: string) => void;
}

// Purely presentational -- no data fetching here, ChatApp owns the sessions
// list/active-session state (see .plans/006-2026-08-11-session-management-plan
// in carqna-agent). Dropdown only appears once there's at least one session;
// a brand-new user sees just the name input + "+" button, per the plan's
// explicit "no auto-creation" decision.
export function SessionHeader({
  userEmail,
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
}: SessionHeaderProps) {
  const [newSessionName, setNewSessionName] = useState("");

  const handleCreate = () => {
    const name = newSessionName.trim();
    if (!name) return;
    onCreateSession(name);
    setNewSessionName("");
  };

  return (
    <header className="flex items-center gap-4 border-b px-4 py-2 text-sm">
      <span className="text-gray-500">{userEmail}</span>

      {sessions.length > 0 && (
        <select
          value={activeSessionId ?? ""}
          onChange={(e) => onSelectSession(Number(e.target.value))}
          className="rounded border px-2 py-1"
        >
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.session_name}
            </option>
          ))}
        </select>
      )}

      <div className="ml-auto flex items-center gap-1">
        <input
          type="text"
          value={newSessionName}
          onChange={(e) => setNewSessionName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
          }}
          placeholder="New session name"
          maxLength={256}
          className="rounded border px-2 py-1"
        />
        <button
          type="button"
          onClick={handleCreate}
          aria-label="Create session"
          className="rounded bg-black px-3 py-1 text-white"
        >
          +
        </button>
      </div>
    </header>
  );
}

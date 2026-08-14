"use client";

import { useCallback, useEffect, useState } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotChatConfigurationProvider } from "@copilotkit/react-core/v2";
import "@copilotkit/react-ui/styles.css";
import { CopilotChat } from "@copilotkit/react-ui";
import { ToolCallRenderers } from "@/components/ToolCallRenderers";
import { SessionHeader, type Session } from "@/components/SessionHeader";

interface ChatAppProps {
  userEmail: string;
}

// The backend registers this agent under the key "carqna_agent"
// (see app/api/copilotkit/route.ts); the frontend defaults to "default"
// unless told otherwise here.
//
// Owns the active-session state for the multi-session picker (see
// carqna-agent/.plans/006-2026-08-11-session-management-plan-INPROG.md):
// fetches the user's sessions from /api/sessions on mount, and passes the
// active session's id as CopilotKit's `threadId` -- switching sessions is
// just changing which id that is, no remount of the fetch logic needed.
export function ChatApp({ userEmail }: ChatAppProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  const refreshSessions = useCallback(async () => {
    const res = await fetch("/api/sessions");
    if (!res.ok) return;
    const data: Session[] = await res.json();
    setSessions(data);
    // Auto-select the most-recently-used session (the backend already
    // orders by access_ts DESC) if nothing's active yet -- without this,
    // activeSessionId stays null while the <select> below has options, and
    // the browser falls back to visually highlighting the first <option>
    // even though React's controlled value doesn't match any of them. That
    // desync is exactly what made the dropdown *look* like session 1 was
    // selected on first load while the chat panel rendered the "no session"
    // placeholder instead.
    setActiveSessionId((current) => current ?? data[0]?.id ?? null);
  }, []);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  const handleCreateSession = useCallback(async (name: string) => {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_name: name }),
    });
    if (!res.ok) {
      // No toast/notification system exists yet -- surface the agent's
      // error detail (e.g. "A session with that name already exists")
      // directly rather than failing silently.
      const body = await res.json().catch(() => null);
      alert(body?.detail ?? "Failed to create session");
      return;
    }
    const created: Session = await res.json();
    setSessions((prev) => [created, ...prev]);
    setActiveSessionId(created.id);
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <SessionHeader
        userEmail={userEmail}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onCreateSession={handleCreateSession}
      />
      {activeSessionId === null ? (
        <div className="flex flex-1 items-center justify-center text-gray-500">
          Create a session to start chatting.
        </div>
      ) : (
        // key={activeSessionId} forces a full remount on session switch --
        // restoring prior chat history is explicitly deferred (see the
        // plan doc), so this at least avoids showing the *previous*
        // session's stale messages under the new session's threadId.
        <CopilotKit key={activeSessionId} runtimeUrl="/api/copilotkit">
          <ToolCallRenderers />
          <CopilotChatConfigurationProvider
            agentId="carqna_agent"
            threadId={String(activeSessionId)}
          >
            <CopilotChat />
          </CopilotChatConfigurationProvider>
        </CopilotKit>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useCarqnaChat } from "@/hooks/useCarqnaChat";
import { EventTraceViewer } from "./EventTraceViewer";

export function ChatInterface() {
  const { threadId, isLoading, events, error, startSession, sendMessage } = useCarqnaChat();
  const [message, setMessage] = useState("");
  const [userMessages, setUserMessages] = useState<string[]>([]);
  const [sessionStarted, setSessionStarted] = useState(false);

  const handleStartSession = async () => {
    await startSession("user-123");
    setSessionStarted(true);
    setUserMessages([]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setUserMessages((prev) => [...prev, message]);
    const currentMessage = message;
    setMessage("");

    await sendMessage(currentMessage);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <h1 className="text-2xl font-bold text-gray-900">CarQnA Assistant</h1>
        <p className="text-sm text-gray-600">
          {sessionStarted ? `Session: ${threadId?.slice(0, 8)}...` : "Ready to start"}
        </p>
      </div>

      {/* Main Content */}
 {/* Main Content Viewport */}
<div className="flex-1 overflow-y-auto p-4 space-y-4">
  {!sessionStarted ? (
    <div className="flex items-center justify-center h-full">
      <button
        onClick={handleStartSession}
        disabled={isLoading}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
      >
        Start New Session
      </button>
    </div>
  ) : (
    <>
      {/* 1. Render what the human user typed onto the screen */}
      {userMessages.map((userContent, index) => {
        // Use the LAST final_response event (a run can emit more than one,
        // e.g. sub-agent handoffs before the top-level synthesis).
        const finalResponseEvents = events.filter((e) => e.type === "final_response");
        const assistantText = finalResponseEvents[finalResponseEvents.length - 1]?.content;

        return (
          <div key={`turn-${index}`} className="space-y-4 w-full">
            {/* Human Message Bubble Layout */}
            <div className="flex justify-end w-full">
              <div className="max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg bg-blue-600 text-white shadow-sm text-sm">
                {userContent}
              </div>
            </div>

            {/* AI Assistant Message Bubble Layout (Only shows the verified string) */}
            {index === userMessages.length - 1 && assistantText && (
              <div className="flex justify-start w-full">
                <div className="max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg bg-gray-200 text-gray-900 border shadow-sm text-sm whitespace-pre-wrap font-sans">
                  {assistantText}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Thinking Indicator Animation */}
      {isLoading && (
        <div className="flex justify-start w-full">
          <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg animate-pulse shadow-sm text-sm border">
            Thinking...
          </div>
        </div>
      )}

      {/* Background operational diagnostics panel views remain perfectly active */}
      {events.length > 0 && <EventTraceViewer events={events} />}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm shadow-sm">
          {error}
        </div>
      )}
    </>
  )}
</div>


      {/* Input Footer */}
      {sessionStarted && (
        <div className="bg-white border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about cars, insurance, pricing..."
              disabled={isLoading}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm"
            />
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium text-sm transition-colors"
            >
              {isLoading ? "..." : "Send"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

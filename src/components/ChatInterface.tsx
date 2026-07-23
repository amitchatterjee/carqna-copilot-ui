"use client";

import { useState } from "react";
import { useCarqnaChat } from "@/hooks/useCarqnaChat";
import { EventTraceViewer } from "./EventTraceViewer";

export function ChatInterface() {
  const { threadId, isLoading, events, error, startSession, sendMessage } = useCarqnaChat();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [sessionStarted, setSessionStarted] = useState(false);

  const handleStartSession = async () => {
    await startSession("user-123");
    setSessionStarted(true);
    setMessages([]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setMessage("");

    await sendMessage(message);

    // Extract final response from events
    const finalEvent = events.find((e) => e.type === "final_response");
    if (finalEvent?.content && typeof finalEvent.content === "string") {
      setMessages((prev) => [...prev, { role: "assistant", content: finalEvent.content as string }]);
    }
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!sessionStarted ? (
          <div className="flex items-center justify-center h-full">
            <button
              onClick={handleStartSession}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? "Starting..." : "Start New Session"}
            </button>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-900"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg animate-pulse">
                  Thinking...
                </div>
              </div>
            )}

            {events.length > 0 && <EventTraceViewer events={events} />}

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
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
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? "..." : "Send"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

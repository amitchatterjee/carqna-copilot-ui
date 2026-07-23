import { useState, useCallback } from "react";
import { streamChat, initConversation } from "@/services/carqnaService";
import type { GraphEvent } from "@/types/carqna";

export function useCarqnaChat() {
  const [threadId, setThreadId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<GraphEvent[]>([]);
  const [error, setError] = useState<string>("");

  const startSession = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      const { thread_id } = await initConversation(userId);
      setThreadId(thread_id);
      setEvents([]);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to init session");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!threadId) {
        setError("No active session");
        return;
      }

      try {
        setIsLoading(true);
        setError("");
        setEvents([]);

        await streamChat(message, threadId, (event) => {
          setEvents((prev) => [...prev, event]);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
      } finally {
        setIsLoading(false);
      }
    },
    [threadId]
  );

  return {
    threadId,
    isLoading,
    events,
    error,
    startSession,
    sendMessage
  };
}

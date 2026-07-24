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

  const [toolsUsed, setToolsUsed] = useState<any[]>([]);
  const [fullTrace, setFullTrace] = useState<any[]>([]);
  const [finalResponseText, setFinalResponseText] = useState<string>("");

  const sendMessage = useCallback(
    async (message: string) => {
      // Clear layout history before a new user submission
      setToolsUsed([]);
      setFullTrace([]);
      setFinalResponseText("");
      if (!threadId) {
        setError("No active session");
        return;
      }

      try {
        setIsLoading(true);
        setError("");
        setEvents([]);

        await streamChat(message, threadId, (event) => {
          // This line is doing ALL the heavy lifting! It shares the data with the UI
          setEvents((prev) => [...prev, event]);

          // 1. Push everything natively to the Full Trace panel timeline
          setFullTrace((prev) => [...prev, event]);

          // 2. Filter tools cleanly for the Tools Used panel matrix
          if (event.type === 'tool_call' || event.type === 'tool_result') {
            setToolsUsed((prev) => [...prev, event]);
          }

          // 3. FIX: Safely store the text string locally inside the hook state if needed
          if (event.type === 'final_response' && event.content) {
            setFinalResponseText(event.content);
          }
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
    sendMessage,
    finalResponseText // Proactively exporting this to make UI rendering effortless!
  };
}

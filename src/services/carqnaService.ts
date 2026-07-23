import type { GraphEvent, InitResponse, ChatResponse } from "@/types/carqna";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3500/v1.0/invoke/carqna-service/method";

export async function initConversation(userId: string): Promise<InitResponse> {
  const baseUrl = API_BASE.endsWith('/') ? API_BASE : `${API_BASE}/`;
  const url = `${baseUrl}init`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId })
  });

  if (!res.ok) throw new Error(`Init failed: ${res.statusText}`);
  return res.json();
}

export async function streamChat(
  message: string,
  threadId: string,
  onEvent: (event: GraphEvent) => void
): Promise<void> {
  const baseUrl = API_BASE.endsWith('/') ? API_BASE : `${API_BASE}/`;
  const url = `${baseUrl}chat/stream`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, thread_id: threadId })
  });

  if (!res.ok) throw new Error(`Stream failed: ${res.statusText}`);

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) throw new Error("No response body");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value).split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const event = JSON.parse(line.slice(6));
          onEvent(event);
        } catch {
          // Skip malformed lines
        }
      }
    }
  }
}

export async function getHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

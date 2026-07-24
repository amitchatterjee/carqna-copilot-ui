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

  // SSE lines can be split across separate chunks (e.g. a long final_response
  // payload straddling a network read boundary). Buffer partial lines across
  // reads instead of parsing each chunk in isolation.
  let buffer = "";

  const emitLine = (line: string) => {
    if (!line.startsWith("data: ")) return;
    try {
      const event = JSON.parse(line.slice(6));
      onEvent(event);
    } catch {
      // Skip malformed lines
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    lines.forEach(emitLine);
  }

  buffer += decoder.decode();
  buffer.split("\n").forEach(emitLine);
}

export async function getHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export interface GraphEvent {
  type: "tool_call" | "tool_result" | "llm_thinking" | "final_response" | "error" | "done";
  step: number;
  timestamp: string;
  tool?: string;
  input?: Record<string, unknown>;
  output?: string;
  content?: string;
  error?: string;
  event_count?: number;
}

export interface ChatResponse {
  response: string;
  thread_id: string;
  timestamp: string;
  metadata: Record<string, unknown>;
  events: GraphEvent[];
  event_count: number;
}

export interface InitResponse {
  thread_id: string;
  status: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface ChatSession {
  threadId: string;
  userId: string;
  sessionName?: string;
  startedAt: string;
}

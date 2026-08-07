"use client";

import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";

interface ToolCallPanelProps {
  name: string;
  toolCallId: string;
  parameters: unknown;
  status: "inProgress" | "executing" | "complete";
  result?: string;
}

// Persistent, per-tool-call collapsible trace panel. Registered via
// useRenderTool in ToolCallRenderers.tsx so this attaches to real messages
// in agent.messages (not CopilotChat's transient "running" placeholder),
// which is what makes it survive after the final answer streams in.
export function ToolCallPanel({ name, parameters, status, result }: ToolCallPanelProps) {
  const [open, setOpen] = useState(status !== "complete");
  const hasAutoCollapsed = useRef(false);

  useEffect(() => {
    if (status === "complete" && !hasAutoCollapsed.current) {
      hasAutoCollapsed.current = true;
      setOpen(false);
    }
  }, [status]);

  return (
    <details
      className="bg-white p-3 rounded border-l-4 border-blue-500 my-2"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="font-semibold cursor-pointer text-blue-900 flex items-center gap-2">
        <StatusIndicator status={status} />
        {name}
      </summary>
      <div className="mt-2 space-y-2">
        <div className="text-xs font-mono bg-gray-100 p-2 rounded">
          <p className="text-gray-600 mb-1">Arguments</p>
          <pre className="overflow-auto">{JSON.stringify(parameters, null, 2)}</pre>
        </div>
        {status === "complete" && (
          <div className="text-xs bg-gray-100 p-2 rounded">
            <p className="text-gray-600 mb-1 font-mono">Result</p>
            <div className="prose prose-sm max-w-none overflow-auto max-h-64">
              <Markdown>{result}</Markdown>
            </div>
          </div>
        )}
      </div>
    </details>
  );
}

function StatusIndicator({ status }: { status: ToolCallPanelProps["status"] }) {
  if (status === "complete") {
    return <span className="text-green-600">✓</span>;
  }
  return (
    <span
      className="inline-block h-3 w-3 rounded-full border-2 border-blue-300 border-t-blue-600 animate-spin"
      aria-label="running"
    />
  );
}

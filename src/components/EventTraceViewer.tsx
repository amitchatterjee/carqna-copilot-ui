import type { GraphEvent } from "@/types/carqna";

interface EventTraceViewerProps {
  events: GraphEvent[];
}

export function EventTraceViewer({ events }: EventTraceViewerProps) {
  const finalEvent = events.find((e) => e.type === "final_response");
  const toolEvents = events.filter((e) => e.type === "tool_call" || e.type === "tool_result");
  const thinkingEvents = events.filter((e) => e.type === "llm_thinking");

  return (
    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
      {finalEvent && (
        <div className="bg-white p-3 rounded border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Response</p>
          <p className="text-base text-gray-900">{finalEvent.content}</p>
        </div>
      )}

      {toolEvents.length > 0 && (
        <details className="bg-white p-3 rounded border-l-4 border-blue-500">
          <summary className="font-semibold cursor-pointer text-blue-900">
            Tools Used ({toolEvents.length})
          </summary>
          <div className="mt-2 space-y-2">
            {toolEvents.map((event, i) => (
              <div key={i} className="text-xs font-mono bg-gray-100 p-2 rounded">
                <strong>{event.tool}:</strong> {event.type === "tool_call" ? "called" : "returned"}
                {event.input && <pre className="mt-1">{JSON.stringify(event.input, null, 2)}</pre>}
                {event.output && <p className="text-gray-700 mt-1">{event.output.slice(0, 200)}...</p>}
              </div>
            ))}
          </div>
        </details>
      )}

      {thinkingEvents.length > 0 && (
        <details className="bg-white p-3 rounded border-l-4 border-purple-500">
          <summary className="font-semibold cursor-pointer text-purple-900">
            Agent Reasoning ({thinkingEvents.length})
          </summary>
          <div className="mt-2 space-y-2">
            {thinkingEvents.map((event, i) => (
              <div key={i} className="text-xs bg-gray-100 p-2 rounded italic text-gray-700">
                💭 {event.content}
              </div>
            ))}
          </div>
        </details>
      )}

      <details className="bg-white p-3 rounded border-l-4 border-gray-400">
        <summary className="font-semibold cursor-pointer text-gray-700">
          Full Trace ({events.length} events)
        </summary>
        <pre className="mt-2 text-xs overflow-auto bg-gray-100 p-2 rounded">
          {JSON.stringify(events, null, 2)}
        </pre>
      </details>
    </div>
  );
}

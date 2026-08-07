# Tech debt

Known, understood limitations that have been deliberately left as-is rather than fixed. Each entry
records the root cause so a future pass doesn't have to re-derive it from scratch.

## ToolCallPanel doesn't show nested subagent tool calls

**What**: when the main agent delegates to a subagent (e.g. `car_price_expert` via the `task` tool),
only the outer `task` call shows up as a collapsible panel (`src/components/ToolCallPanel.tsx`). The
subagent's own internal tool calls (e.g. `SearchIndexTool` against OpenSearch) never appear, even
though they do stream as real `TOOL_CALL_START/ARGS/END/RESULT` AG-UI events on the wire.

**Root cause**: structural, not a rendering bug. `deepagents/middleware/subagents.py`'s
`_return_command_with_state_update` only merges the subagent's *final* result back into the outer
LangGraph's `messages` state, as a single `ToolMessage` responding to the `task` call. The subagent's
own intermediate turns (its own LLM call, its own tool calls) live entirely inside the isolated
`subagent.ainvoke(...)` call and never get merged into the outer graph's persisted state. Confirmed
via a live trace: `MESSAGES_SNAPSHOT` never contains an entry for the subagent-internal tool calls,
even though the raw AG-UI event stream does carry them.

`ToolCallPanel`/`ToolCallRenderers.tsx` render off `agent.messages` (via `@copilotkit/react-core`'s
`useLazyToolRenderer`), which is built from exactly that persisted message state — so there's nothing
to render for these calls no matter how the component is written.

**To actually fix, if ever prioritized** (bigger than a component tweak):
1. Render off the raw AG-UI event stream instead of `agent.messages` (the agent object exposes a
   subscription API for raw tool-call events independent of message snapshots) — effectively
   rebuilding what the old, deleted `EventTraceViewer.tsx`/`carqna_dapr.py`'s `_format_graph_event`
   used to do, on the new AG-UI foundation.
2. Or change how DeepAgents merges subagent state, forwarding intermediate messages too — touches
   `deepagents` (third-party) behavior.

**Status**: deliberately left as-is (2026-08-07) — decided the outer delegation + final result is
enough detail for now.

## ToolCallPanel only shows the first tool call when a message has more than one

**What**: if a single assistant turn includes multiple tool calls (e.g. the agent decides to
delegate to two subagents in one shot — observed with a question asking for both car price and NC
insurance info), only the **first** tool call ever gets a panel. The second one is silently dropped,
even though both actually execute (visible in the backend's streamed events).

**Root cause**: a hard limit in `@copilotkit/react-core`'s `useLazyToolRenderer` (used internally by
`CopilotChat`, and therefore by everything under `src/components/ToolCallRenderers.tsx`):

```js
function useLazyToolRenderer() {
	const renderToolCall = useRenderToolCall$1();
	return useCallback((message, messages) => {
		if (!message?.toolCalls?.length) return null;
		const toolCall = message.toolCalls[0];   // <- only ever the first one
		...
	}, [renderToolCall]);
}
```

This walks each assistant message and only ever looks at `toolCalls[0]`. Any additional tool calls
on the same message never reach `useRenderTool`'s registry at all — not something fixable from
`ToolCallPanel.tsx`/`ToolCallRenderers.tsx`, since the message-walking logic itself drops the data
before our code ever sees it.

**To actually fix, if ever prioritized**: stop relying on `CopilotChat`'s built-in message walking —
either patch/replace the rendering path to iterate *all* of a message's `toolCalls` (not just index
0), or move to the same raw-event-stream approach as the nested-subagent issue above (which would
naturally cover this case too, since it doesn't depend on `agent.messages` at all).

**Status**: deliberately left as-is (2026-08-07) — same call as the nested-subagent gap above.

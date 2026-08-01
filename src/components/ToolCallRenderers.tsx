"use client";

import { useRenderTool } from "@copilotkit/react-core/v2";
import { ToolCallPanel } from "./ToolCallPanel";

// Registers a wildcard tool-call renderer so every tool call (subagent
// delegation, MCP lookups, ...) renders as a persistent collapsible panel
// instead of CopilotChat's default transient "running" placeholder. Must be
// mounted inside <CopilotKit> -- useRenderTool needs that context. Renders
// nothing itself.
export function ToolCallRenderers() {
  useRenderTool(
    {
      name: "*",
      render: (props) => <ToolCallPanel {...props} />,
    },
    [],
  );
  return null;
}

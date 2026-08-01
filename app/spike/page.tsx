"use client";

// Step 1 spike: throwaway route to validate the AG-UI backend end-to-end
// (discovery, streaming, tool calls) before any real UI work. No styling.
// See .plans/copilot-ui-remediation-plan.md.

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotChatConfigurationProvider } from "@copilotkit/react-core/v2";
import "@copilotkit/react-ui/styles.css";
import { CopilotChat } from "@copilotkit/react-ui";
import { ToolCallRenderers } from "@/components/ToolCallRenderers";

// The backend registers this agent under the key "carqna_agent"
// (see app/api/copilotkit/route.ts); the frontend defaults to "default"
// unless told otherwise here.
export default function SpikePage() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <ToolCallRenderers />
      <CopilotChatConfigurationProvider agentId="carqna_agent">
        <CopilotChat />
      </CopilotChatConfigurationProvider>
    </CopilotKit>
  );
}

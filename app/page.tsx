"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotChatConfigurationProvider } from "@copilotkit/react-core/v2";
import "@copilotkit/react-ui/styles.css";
import { CopilotChat } from "@copilotkit/react-ui";
import { ToolCallRenderers } from "@/components/ToolCallRenderers";

// The backend registers this agent under the key "carqna_agent"
// (see app/api/copilotkit/route.ts); the frontend defaults to "default"
// unless told otherwise here.
export default function Home() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <ToolCallRenderers />
      <CopilotChatConfigurationProvider agentId="carqna_agent">
        <CopilotChat />
      </CopilotChatConfigurationProvider>
    </CopilotKit>
  );
}

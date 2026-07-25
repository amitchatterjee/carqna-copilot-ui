import { HttpAgent } from "@ag-ui/client";
import {
  CopilotRuntime,
  EmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";

// Step 1 spike: talk to copilotkit_server.py (a raw AG-UI endpoint) running
// directly on the host, no Docker/Dapr. See .plans/copilot-ui-remediation-plan.md.
//
// `@copilotkit/runtime/langgraph`'s `LangGraphHttpAgent` is just `HttpAgent`
// re-exported under a friendlier name (`declare class LangGraphHttpAgent
// extends HttpAgent {}`), but that re-export's bundled .d.mts drops the
// inherited constructor typing (TS2740/TS2554), so import `HttpAgent`
// directly from `@ag-ui/client` instead -- functionally identical.
const runtime = new CopilotRuntime({
  agents: {
    carqna_agent: new HttpAgent({
      url: process.env.CARQNA_AGENT_URL ?? "http://localhost:8000/",
    }),
  },
});

const serviceAdapter = new EmptyAdapter();

export const POST = async (req: Request) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};

import { HttpAgent } from "@ag-ui/client";
import {
  CopilotRuntime,
  EmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";


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

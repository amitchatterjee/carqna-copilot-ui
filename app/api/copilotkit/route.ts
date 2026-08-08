import { HttpAgent } from "@ag-ui/client";
import {
  CopilotRuntime,
  EmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { context, propagation, trace } from "@opentelemetry/api";

const tracer = trace.getTracer("carqna-copilot-ui");

// @vercel/otel's automatic fetch instrumentation doesn't reliably cover this
// call: it's scoped to the App Router's rendering pipeline (its "fetch" span
// type is literally AppRender.fetch), which Route Handlers don't go through,
// and even where it does apply it only propagates trace context to Vercel
// deployment URLs by default -- a local agent URL needs explicit opt-in.
// Inject the trace context manually instead of relying on it, so this call
// links into the same trace as the incoming request.
const tracedFetch: typeof fetch = (input, init) => {
  return tracer.startActiveSpan("POST carqna_agent", (span) => {
    const headers = new Headers(init?.headers);
    propagation.inject(context.active(), headers, {
      set: (carrier, key, value) => carrier.set(key, value),
    });
    return fetch(input, { ...init, headers }).finally(() => span.end());
  });
};

const runtime = new CopilotRuntime({
  agents: {
    carqna_agent: new HttpAgent({
      url: process.env.CARQNA_AGENT_URL ?? "http://localhost:8000/",
      fetch: tracedFetch,
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

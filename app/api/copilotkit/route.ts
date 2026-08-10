import { HttpAgent } from "@ag-ui/client";
import {
  CopilotRuntime,
  EmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { context, propagation, trace } from "@opentelemetry/api";
import { auth0 } from "@/lib/auth0";

const tracer = trace.getTracer("carqna-copilot-ui");

// @vercel/otel's automatic fetch instrumentation doesn't reliably cover this
// call: it's scoped to the App Router's rendering pipeline (its "fetch" span
// type is literally AppRender.fetch), which Route Handlers don't go through,
// and even where it does apply it only propagates trace context to Vercel
// deployment URLs by default -- a local agent URL needs explicit opt-in.
// Inject the trace context manually instead of relying on it, so this call
// links into the same trace as the incoming request.
//
// Also attaches the current user's access token (scoped to AUTH0_AUDIENCE)
// as a Bearer header, same request context/pattern as the traceparent
// injection above -- this is what carqna-agent/src/agent/auth.py verifies.
// auth0.getAccessToken() reads the session via next/headers' cookies(),
// which works here because tracedFetch is invoked *during* request handling
// (from within HttpAgent's call), even though it's defined at module scope.
const tracedFetch: typeof fetch = (input, init) => {
  return tracer.startActiveSpan("POST carqna_agent", async (span) => {
    const headers = new Headers(init?.headers);
    propagation.inject(context.active(), headers, {
      set: (carrier, key, value) => carrier.set(key, value),
    });

    const { token } = await auth0.getAccessToken();
    headers.set("Authorization", `Bearer ${token}`);

    try {
      return await fetch(input, { ...init, headers });
    } finally {
      span.end();
    }
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

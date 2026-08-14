import { context, propagation, trace } from "@opentelemetry/api";
import { auth0 } from "@/lib/auth0";

const tracer = trace.getTracer("carqna-copilot-ui");

const agentBaseUrl = process.env.CARQNA_AGENT_URL ?? "http://localhost:8000/";

// Same pattern as app/api/copilotkit/route.ts's tracedFetch: server-side
// auth0.getAccessToken() (the token never reaches the browser) plus trace
// context propagation, so these calls land in the same Jaeger trace as
// whatever triggered them. See
// carqna-agent/.plans/006-2026-08-11-session-management-plan-INPROG.md for
// the endpoints this proxies to (GET/POST carqna-agent's /sessions).
async function callAgent(path: string, init: RequestInit): Promise<Response> {
  const method = init.method ?? "GET";
  return tracer.startActiveSpan(`${method} carqna_agent/${path}`, async (span) => {
    const headers = new Headers(init.headers);
    propagation.inject(context.active(), headers, {
      set: (carrier, key, value) => carrier.set(key, value),
    });

    const { token } = await auth0.getAccessToken();
    headers.set("Authorization", `Bearer ${token}`);

    try {
      return await fetch(new URL(path, agentBaseUrl), { ...init, headers });
    } finally {
      span.end();
    }
  });
}

// Forwards status + body + content-type from the agent's response, without
// assuming it's always JSON (error responses etc. should pass through as-is).
function proxyResponse(res: Response): Response {
  const headers = new Headers();
  const contentType = res.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  return new Response(res.body, { status: res.status, headers });
}

export async function GET() {
  const res = await callAgent("sessions", { method: "GET" });
  return proxyResponse(res);
}

export async function POST(req: Request) {
  const body = await req.text();
  const res = await callAgent("sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  return proxyResponse(res);
}

import { registerOTel } from "@vercel/otel";

// Auto-instruments Next.js (including outgoing fetch calls, e.g. the
// CopilotKit route's call to copilotkit_server.py) and exports to the OTLP
// endpoint in OTEL_EXPORTER_OTLP_ENDPOINT (see .env.local / .env.example) --
// same Jaeger instance the backend exports to, so traces from a single
// request link up across both services.
export function register() {
  registerOTel({ serviceName: "carqna-copilot-ui" });
}

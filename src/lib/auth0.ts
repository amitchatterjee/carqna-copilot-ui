import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextResponse } from "next/server";

// AUTH0_AUDIENCE isn't one of @auth0/nextjs-auth0's own env vars -- it must
// be requested explicitly via authorizationParameters.audience, or Auth0
// issues an opaque access token the backend (carqna-agent/src/agent/auth.py)
// can't verify as a JWT. See
// .plans/004-2026-08-09-oauth2-okta-auth-plan-INPROG.md.
export const auth0 = new Auth0Client({
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
  },
  // The SDK's default onCallback swallows the real OAuth error/error_description
  // into a bare "An error occurred during the authorization flow." 500 body --
  // error.cause has the actual reason Auth0 sent back. Log it so callback
  // failures are diagnosable from the dev server terminal instead of opaque.
  async onCallback(error, ctx, session) {
    if (error) {
      console.error("Auth0 callback error:", error.message, error.cause ?? error);
      return new NextResponse(error.message, { status: 500 });
    }
    const appBaseUrl = ctx.appBaseUrl ?? "http://localhost:3000";
    return NextResponse.redirect(new URL(ctx.returnTo || "/", appBaseUrl));
  },
});

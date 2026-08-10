import { auth0 } from "@/lib/auth0";
import { ChatApp } from "@/components/ChatApp";

// Server component: gates the chat UI behind an Auth0 session. The actual
// login redirect is handled by proxy.ts + @auth0/nextjs-auth0's /auth/login
// route, not here -- this just decides which UI to render.
export default async function Home() {
  const session = await auth0.getSession();

  if (!session) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <a
          href="/auth/login"
          className="rounded bg-black px-4 py-2 text-white"
        >
          Log in
        </a>
      </main>
    );
  }

  return <ChatApp />;
}

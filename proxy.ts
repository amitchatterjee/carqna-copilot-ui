import { auth0 } from "@/lib/auth0";

// Next.js 16 renamed middleware.ts -> proxy.ts (middleware.ts still works but
// is deprecated for the Node runtime). See
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md.
export async function proxy(request: Request) {
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};

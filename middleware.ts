import { NextRequest, NextResponse } from "next/server";

// Per-request CSP nonce. Replaces the `'unsafe-inline'` allowance on
// script-src so the entire XSS-mitigation path actually mitigates.
// MDN CSP nonce: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/Sources#nonce-base64-value
// Next.js docs on nonce-based CSP with middleware: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy

const isDev = process.env.NODE_ENV !== "production";

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function buildCsp(nonce: string): string {
  // 'strict-dynamic' lets Next's nonced bootstrap script load its child scripts
  // without each needing a nonce — necessary because Next emits per-build
  // chunk URLs we can't pre-allowlist.
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      "https://www.thesportsdb.com",
      "https://*.thesportsdb.com",
    ],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", ...(isDev ? ["ws:", "http://localhost:*"] : [])],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "object-src": ["'none'"],
    "upgrade-insecure-requests": [],
  };
  return Object.entries(directives)
    .map(([k, v]) => (v.length ? `${k} ${v.join(" ")}` : k))
    .join("; ");
}

export function middleware(req: NextRequest) {
  const nonce = generateNonce();
  const csp = buildCsp(nonce);

  // Propagate nonce to the request so server components can read it via headers().
  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("x-nonce", nonce);

  const res = NextResponse.next({ request: { headers: reqHeaders } });
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

// Skip middleware on static assets, the manifest, the service worker,
// and the favicon — none of those render the layout, so no nonce needed.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|svg|gif|webp|woff2?)).*)",
  ],
};

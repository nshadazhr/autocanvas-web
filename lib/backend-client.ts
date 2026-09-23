import { auth } from "@platform/auth";
import { signBridgeToken } from "@platform/auth/bridge-token";

// ─────────────────────────────────────────────────────────────────────────
// The one place apps/web talks HTTP to apps/backend. Every audio Server
// Action (see app/(app)/audio/actions.ts) goes through `backendFetch`
// instead of calling @platform/database/@platform/queue/etc. directly —
// that's the entire "real API boundary" this chunk introduces. See
// packages/auth/src/bridge-token.ts for what the Bearer token actually is.
// ─────────────────────────────────────────────────────────────────────────

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export class BackendApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "BackendApiError";
  }
}

interface NestErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const { message } = body as NestErrorBody;
  if (Array.isArray(message)) return message.join(" "); // class-validator returns one string per failed field
  if (typeof message === "string") return message;
  return fallback;
}

async function getBridgeToken(): Promise<string> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not signed in.");
  }
  return signBridgeToken({
    sub: session.user.id,
    role: session.user.role,
    email: session.user.email,
  });
}

/**
 * Thin fetch wrapper: signs a fresh bridge token, calls apps/backend, and
 * throws `BackendApiError` (message already unwrapped from Nest's error
 * shape) on anything other than 2xx. Callers in actions.ts catch this and
 * translate it into the `ActionResult` shape the existing form components
 * already expect — this file has no opinion on Next.js concerns like that.
 */
export async function backendFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getBridgeToken();

  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
    cache: "no-store", // every audio read must reflect the latest DB state; nothing here is a candidate for caching
  });

  const rawBody = await response.text();
  const parsedBody = rawBody ? JSON.parse(rawBody) : undefined;

  if (!response.ok) {
    throw new BackendApiError(response.status, extractErrorMessage(parsedBody, "Request to backend failed."));
  }

  return parsedBody as T;
}

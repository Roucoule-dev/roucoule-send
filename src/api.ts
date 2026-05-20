import type { DeliveryResult, SendPackage } from "./types.ts";

const PACKAGE_PATH = (f: string, a: string) =>
  `/api/v1/feeds/${f}/articles/${a}/package`;
const MARK_SENT_PATH = (f: string, a: string) =>
  `/api/v1/feeds/${f}/articles/${a}/mark-sent`;

export interface ApiClient {
  fetchPackage(feedId: string, articleId: string): Promise<SendPackage>;
  markSent(
    feedId: string,
    articleId: string,
    results: DeliveryResult[],
  ): Promise<void>;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function createApiClient(
  baseUrl: string,
  apiToken: string,
  fetchImpl: typeof fetch = fetch,
): ApiClient {
  const base = baseUrl.replace(/\/+$/, "");
  const headers = { Authorization: `Bearer ${apiToken}` };

  async function ensureOk(res: Response): Promise<void> {
    if (res.ok) return;
    let code = "unknown";
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json() as Record<string, unknown>;
      code = (body.error as string | undefined) ?? code;
      message = (body.message as string | undefined) ?? message;
    } catch { /* body non-json */ }
    throw new ApiError(res.status, code, message);
  }

  return {
    async fetchPackage(feedId, articleId) {
      const res = await fetchImpl(
        `${base}${PACKAGE_PATH(feedId, articleId)}`,
        {
          headers,
        },
      );
      await ensureOk(res);
      return await res.json() as SendPackage;
    },
    async markSent(feedId, articleId, results) {
      const res = await fetchImpl(
        `${base}${MARK_SENT_PATH(feedId, articleId)}`,
        {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ results }),
        },
      );
      await ensureOk(res);
    },
  };
}

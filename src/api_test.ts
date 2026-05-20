import { assert, assertEquals, assertRejects } from "@std/assert";
import { ApiError, createApiClient } from "./api.ts";
import type { SendPackage } from "./types.ts";

// ---------------------------------------------------------------------------
// Test A — happy path: fetchPackage parses the 200 response body
// ---------------------------------------------------------------------------
Deno.test("fetchPackage: happy path returns parsed SendPackage", async () => {
  const mockBody: SendPackage = {
    articleId: "art_Y",
    subject: "Hello world",
    fromHint: { name: "Newsletter", email: "news@example.test" },
    recipients: [
      {
        subscriberId: "sub_1",
        email: "reader@example.test",
        htmlBody: "<p>Hi</p>",
        textBody: "Hi",
        headers: {},
      },
    ],
  };

  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;

  const mockFetch: typeof fetch = (input, init) => {
    capturedUrl = input as string;
    capturedInit = init;
    return Promise.resolve(
      new Response(JSON.stringify(mockBody), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  };

  // Use a trailing-slash baseUrl to verify it is stripped
  const client = createApiClient(
    "https://example.test/",
    "rcl_test",
    mockFetch,
  );
  const result = await client.fetchPackage("feed_X", "art_Y");

  assert(
    capturedUrl.endsWith("/api/v1/feeds/feed_X/articles/art_Y/package"),
    `URL should end with /package, got: ${capturedUrl}`,
  );
  assertEquals(
    (capturedInit?.headers as Record<string, string>)["Authorization"],
    "Bearer rcl_test",
  );
  assertEquals(result, mockBody);
});

// ---------------------------------------------------------------------------
// Test B — error path: 400 JSON error throws ApiError
// ---------------------------------------------------------------------------
Deno.test("fetchPackage: 400 JSON error throws ApiError", async () => {
  const mockFetch: typeof fetch = (_input, _init) =>
    Promise.resolve(
      new Response(
        JSON.stringify({ error: "not_ready", message: "Article not ready." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

  const client = createApiClient(
    "https://example.test",
    "rcl_test",
    mockFetch,
  );

  const err = await assertRejects(
    () => client.fetchPackage("feed_X", "art_Y"),
    ApiError,
  );
  assertEquals(err.status, 400);
  assertEquals(err.code, "not_ready");
  assertEquals(err.message, "Article not ready.");
});

// ---------------------------------------------------------------------------
// Test C — markSent POSTs correct body/method and returns void on 200
// ---------------------------------------------------------------------------
Deno.test("markSent: POSTs sentToCount and returns void on 200", async () => {
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;

  const mockFetch: typeof fetch = (input, init) => {
    capturedUrl = input as string;
    capturedInit = init;
    return Promise.resolve(new Response(null, { status: 200 }));
  };

  const client = createApiClient(
    "https://example.test",
    "rcl_test",
    mockFetch,
  );
  const result = await client.markSent("feed_X", "art_Y", 42);

  assert(
    capturedUrl.endsWith("/api/v1/feeds/feed_X/articles/art_Y/mark-sent"),
    `URL should end with /mark-sent, got: ${capturedUrl}`,
  );
  assertEquals(capturedInit?.method, "POST");
  assertEquals(
    (capturedInit?.headers as Record<string, string>)["Content-Type"],
    "application/json",
  );
  assertEquals(JSON.parse(capturedInit?.body as string), { sentToCount: 42 });
  assertEquals(result, undefined);
});

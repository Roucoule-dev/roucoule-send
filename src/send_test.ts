import { assertEquals } from "@std/assert";
import type { ApiClient } from "./api.ts";
import type { SendArgs, SmtpSender } from "./smtp.ts";
import type { Recipient, SendPackage } from "./types.ts";
import { send } from "./send.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function r(email: string): Recipient {
  return {
    subscriberId: `sub_${email}`,
    email,
    htmlBody: `<p>${email}</p>`,
    textBody: email,
    headers: { "List-Unsubscribe": `<https://x/u/${email}>` },
  };
}

function makeMockApi(pkg: SendPackage): ApiClient & {
  markSentCalls: Array<
    { feedId: string; articleId: string; sentToCount: number }
  >;
} {
  const markSentCalls: Array<{
    feedId: string;
    articleId: string;
    sentToCount: number;
  }> = [];
  return {
    markSentCalls,
    async fetchPackage(_feedId, _articleId) {
      return await Promise.resolve(pkg);
    },
    async markSent(feedId, articleId, sentToCount) {
      markSentCalls.push({ feedId, articleId, sentToCount });
      return await Promise.resolve();
    },
  };
}

function makeMockSender(opts: { failFor?: Set<string> } = {}): SmtpSender & {
  calls: SendArgs[];
} {
  const calls: SendArgs[] = [];
  return {
    calls,
    async send(args) {
      calls.push(args);
      if (opts.failFor?.has(args.recipient.email)) {
        throw new Error(`SMTP error for ${args.recipient.email}`);
      }
      return await Promise.resolve();
    },
    async close() {
      return await Promise.resolve();
    },
  };
}

const noop = () => {};
const noSleep = () => Promise.resolve();

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

Deno.test("A — happy path: 3 recipients, no failures", async () => {
  const pkg: SendPackage = {
    articleId: "art1",
    subject: "Hello",
    fromHint: { name: "Newsletter", email: "news@example.com" },
    recipients: [
      r("alice@example.com"),
      r("bob@example.com"),
      r("carol@example.com"),
    ],
  };
  const api = makeMockApi(pkg);
  const sender = makeMockSender();

  const result = await send(
    { api, sender, log: noop, sleep: noSleep },
    "feed1",
    "art1",
  );

  assertEquals(result, { sent: 3, failed: 0, failures: [] });
  assertEquals(sender.calls.length, 3);
  assertEquals(api.markSentCalls.length, 1);
  assertEquals(api.markSentCalls[0].sentToCount, 3);
});

Deno.test("B — dry-run: no emails sent, no markSent", async () => {
  const pkg: SendPackage = {
    articleId: "art2",
    subject: "Dry",
    fromHint: { name: "Newsletter", email: "news@example.com" },
    recipients: [r("alice@example.com"), r("bob@example.com")],
  };
  const api = makeMockApi(pkg);
  const sender = makeMockSender();

  const result = await send(
    { api, sender, log: noop, sleep: noSleep },
    "feed1",
    "art2",
    { dryRun: true },
  );

  assertEquals(result, { sent: 0, failed: 0, failures: [] });
  assertEquals(sender.calls.length, 0);
  assertEquals(api.markSentCalls.length, 0);
});

Deno.test("C — filter: only matching recipient is sent", async () => {
  const pkg: SendPackage = {
    articleId: "art3",
    subject: "Filtered",
    fromHint: { name: "Newsletter", email: "news@example.com" },
    recipients: [
      r("alice@example.com"),
      r("bob@example.com"),
      r("carol@example.com"),
    ],
  };
  const api = makeMockApi(pkg);
  const sender = makeMockSender();

  const result = await send(
    { api, sender, log: noop, sleep: noSleep },
    "feed1",
    "art3",
    { filter: "alice@example.com" },
  );

  assertEquals(result.sent, 1);
  assertEquals(result.failed, 0);
  assertEquals(sender.calls.length, 1);
  assertEquals(sender.calls[0].recipient.email, "alice@example.com");
  assertEquals(api.markSentCalls.length, 1);
  assertEquals(api.markSentCalls[0].sentToCount, 1);
});

Deno.test("D — partial failures: one recipient fails", async () => {
  const pkg: SendPackage = {
    articleId: "art4",
    subject: "Partial",
    fromHint: { name: "Newsletter", email: "news@example.com" },
    recipients: [
      r("alice@example.com"),
      r("bob@example.com"),
      r("carol@example.com"),
    ],
  };
  const api = makeMockApi(pkg);
  const sender = makeMockSender({ failFor: new Set(["bob@example.com"]) });

  const result = await send(
    { api, sender, log: noop, sleep: noSleep },
    "feed1",
    "art4",
  );

  assertEquals(result.sent, 2);
  assertEquals(result.failed, 1);
  assertEquals(result.failures.length, 1);
  assertEquals(result.failures[0].email, "bob@example.com");
  assertEquals(result.failures[0].error, "SMTP error for bob@example.com");
  assertEquals(api.markSentCalls.length, 1);
  assertEquals(api.markSentCalls[0].sentToCount, 2);
});

Deno.test("E — all-fail: markSent is NOT called", async () => {
  const pkg: SendPackage = {
    articleId: "art5",
    subject: "AllFail",
    fromHint: { name: "Newsletter", email: "news@example.com" },
    recipients: [r("alice@example.com"), r("bob@example.com")],
  };
  const api = makeMockApi(pkg);
  const sender = makeMockSender({
    failFor: new Set(["alice@example.com", "bob@example.com"]),
  });

  const result = await send(
    { api, sender, log: noop, sleep: noSleep },
    "feed1",
    "art5",
  );

  assertEquals(result.sent, 0);
  assertEquals(result.failed, 2);
  assertEquals(result.failures.length, 2);
  assertEquals(api.markSentCalls.length, 0);
});

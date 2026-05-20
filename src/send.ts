import type { ApiClient } from "./api.ts";
import type { SmtpSender } from "./smtp.ts";
import type { Recipient, SendOptions, SendResult } from "./types.ts";

export interface SendDeps {
  api: ApiClient;
  sender: SmtpSender;
  log?: (msg: string) => void;
  sleep?: (ms: number) => Promise<void>;
}

export async function send(
  deps: SendDeps,
  feedId: string,
  articleId: string,
  opts: SendOptions = {},
): Promise<SendResult> {
  const log = deps.log ?? ((m) => console.log(m));
  const sleep = deps.sleep ??
    ((ms) => new Promise((r) => setTimeout(r, ms)));

  const pkg = await deps.api.fetchPackage(feedId, articleId);

  let recipients: Recipient[] = pkg.recipients;
  if (opts.filter) {
    recipients = recipients.filter((r) => r.email === opts.filter);
  }
  if (opts.limit && opts.limit < recipients.length) {
    recipients = recipients.slice(0, opts.limit);
  }

  log(`Article : ${articleId}`);
  log(`From    : ${pkg.fromHint.name} <${pkg.fromHint.email}>`);
  log(`Subject : ${pkg.subject}`);
  log(`Destinataires : ${recipients.length}`);

  if (opts.dryRun) {
    log("[dry-run] Aucun email envoyé.");
    return { sent: 0, failed: 0, failures: [] };
  }

  const batchSize = opts.batchSize ?? 20;
  const delayMs = opts.delayMs ?? 1000;
  let sent = 0;
  const failures: Array<{ email: string; error: string }> = [];

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    for (const r of batch) {
      try {
        await deps.sender.send({
          from: pkg.fromHint,
          subject: pkg.subject,
          recipient: r,
        });
        sent++;
      } catch (err) {
        failures.push({
          email: r.email,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    if (i + batchSize < recipients.length) await sleep(delayMs);
  }
  log(`Envoyés : ${sent} | Échecs : ${failures.length}`);

  const allFailed = sent === 0 && recipients.length > 0;
  if (!opts.skipMarkSent && !allFailed) {
    await deps.api.markSent(feedId, articleId, sent);
    log("✓ Article marqué comme envoyé.");
  }
  return { sent, failed: failures.length, failures };
}

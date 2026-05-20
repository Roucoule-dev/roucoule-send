# @roucoule/send

> Open-source CLI and library to send [Roucoule](https://roucoule.dev)
> newsletters via your own SMTP server.

[![JSR](https://jsr.io/badges/@roucoule/send)](https://jsr.io/@roucoule/send)
[![npm](https://img.shields.io/npm/v/@roucoule/send.svg)](https://www.npmjs.com/package/@roucoule/send)
[![CI](https://github.com/thomascarvalho/roucoule-send/actions/workflows/ci.yml/badge.svg)](https://github.com/thomascarvalho/roucoule-send/actions/workflows/ci.yml)

Roucoule itself is a closed-source SaaS, but **this client is open**: it handles
your SMTP credentials, so you can audit exactly what happens to them. They never
leave your machine.

## Why this exists

Roucoule offers two send workflows:

1. **Server-side send** (default): Roucoule stores your SMTP credentials
   encrypted and sends on your behalf. Simple, works for most users.
2. **External send** (this package): You keep SMTP credentials on your machine.
   Roucoule never sees them.

## Installation

### Node (npm)

```bash
npm install -g @roucoule/send
# or one-off:
npx @roucoule/send --feed-id feed_xxx art_yyy
```

### Deno (JSR)

```bash
deno install -gA jsr:@roucoule/send
```

Both expose the same `roucoule-send` command.

## Quick start

```bash
# First run: interactive wizard for SMTP + API token.
# Saved to ~/.config/roucoule/config.json (mode 0600).
roucoule-send

# Send an article (prepare it as "ready to send" in the Roucoule UI first).
roucoule-send --feed-id feed_xxx art_yyy

# Dry run.
roucoule-send --feed-id feed_xxx --dry-run art_yyy
```

Run `roucoule-send --help` for full options.

## Programmatic use

```ts
// Node:
import { createApiClient, createNodemailerSender, send } from "@roucoule/send";

// Deno:
// import { ... } from "jsr:@roucoule/send";

const api = createApiClient("https://roucoule.dev", "rcl_…");
const sender = createNodemailerSender({
  host: "mail.example.com",
  port: 465,
  username: "you@example.com",
  password: "…",
});

const result = await send({ api, sender }, "feed_xxx", "art_yyy");
console.log(`Sent ${result.sent}, failed ${result.failed}`);
```

## GitHub Action

See [`examples/github-action.yml`](./examples/github-action.yml).

## Deliverability

Whatever you send with, your `From:` domain needs SPF, DKIM, and DMARC. Test
with [mail-tester.com](https://www.mail-tester.com) before your first real send.

## License

MIT. See [`LICENSE`](./LICENSE).

## Contributing

Bug reports and small PRs welcome. This package is intentionally minimal — a
thin client over the Roucoule API. Feature requests are better directed to the
Roucoule service itself.

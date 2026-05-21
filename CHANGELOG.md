# Changelog

## 0.1.0 — 2026-05-21

- Initial release.
- CLI `roucoule-send` with first-run wizard.
- Programmatic exports: `createApiClient`, `createNodemailerSender`, `send`,
  config helpers.
- `markSent` reports per-recipient outcomes
  (`{ subscriberId, status: 'sent' | 'failed', error? }[]`), so the Roucoule
  admin UI can show who received and who didn't. `SendResult.failures` now
  includes the `subscriberId` alongside the email.
- Dual distribution: JSR (`jsr:@roucoule/send`) and npm (`@roucoule/send`).
- GitHub Actions example template (npm + JSR variants).

# Examples

Templates copiables pour automatiser l'envoi.

- `github-action.yml` — workflow GitHub Actions à copier dans
  `.github/workflows/send-newsletter.yml` du repo de ton blog. Déclenchement
  manuel via `workflow_dispatch`. Deux variantes runtime : `npx @roucoule/send`
  (Node) ou `deno run -A jsr:@roucoule/send`.

> **Pourquoi pas un cron auto ?** Roucoule prévoit une étape de préparation par
> article (sujet custom, intro perso, clic « prêt à envoyer »). Le template
> laisse cette étape dans l'UI Roucoule et ne fait que la dernière ligne droite
> SMTP.

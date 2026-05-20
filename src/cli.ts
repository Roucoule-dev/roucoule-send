#!/usr/bin/env -S deno run -A
import { parseArgs } from "@std/cli/parse-args";
import { configExists, loadConfig } from "./config.ts";
import { runWizard } from "./wizard.ts";
import { ApiError, createApiClient } from "./api.ts";
import { createNodemailerSender } from "./smtp.ts";
import { send } from "./send.ts";

const HELP = `roucoule-send — envoyer un article Roucoule depuis ta machine

Usage :
  roucoule-send                          Lance le wizard de configuration.
  roucoule-send --feed-id F <art_id>     Envoie un article.

Options :
  --feed-id <id>      ID du feed (requis pour envoyer).
  --dry-run           Liste sans envoyer.
  --limit N           Limite à N destinataires.
  --filter EMAIL      N'envoie qu'à cette adresse.
  --batch-size N      Taille de batch (défaut 20).
  --delay-ms N        Délai entre batchs (défaut 1000).
  --no-mark-sent      Ne pas appeler mark-sent après l'envoi.
  --reconfigure       Relance le wizard.
  -h, --help          Affiche cette aide.

La configuration est lue depuis ~/.config/roucoule/config.json (XDG).
`;

async function main(): Promise<number> {
  const args = parseArgs(Deno.args, {
    boolean: ["dry-run", "no-mark-sent", "reconfigure", "help"],
    string: ["feed-id", "limit", "filter", "batch-size", "delay-ms"],
    alias: { h: "help" },
  });

  if (args.help) {
    console.log(HELP);
    return 0;
  }

  if (args.reconfigure || !(await configExists())) {
    await runWizard();
    if (args.reconfigure) return 0;
  }

  const articleId = args._[0] ? String(args._[0]) : null;
  if (!articleId) {
    console.error("Article-id manquant. Usage : roucoule-send <article-id>");
    return 2;
  }
  const feedId = args["feed-id"];
  if (!feedId) {
    console.error("--feed-id requis (pour l'instant).");
    return 2;
  }

  const config = await loadConfig();
  if (!config) {
    console.error(
      "Configuration absente. Lance `roucoule-send` sans argument.",
    );
    return 1;
  }

  const api = createApiClient(config.baseUrl, config.apiToken);
  const sender = createNodemailerSender(config.smtp);

  try {
    const res = await send(
      { api, sender },
      String(feedId),
      articleId,
      {
        dryRun: args["dry-run"],
        limit: args.limit ? Number(args.limit) : undefined,
        filter: args.filter,
        batchSize: args["batch-size"] ? Number(args["batch-size"]) : undefined,
        delayMs: args["delay-ms"] ? Number(args["delay-ms"]) : undefined,
        skipMarkSent: args["no-mark-sent"],
      },
    );
    if (res.failed > 0) {
      for (const f of res.failures) {
        console.error(`  ✗ ${f.email}: ${f.error}`);
      }
      return res.sent > 0 ? 0 : 1;
    }
    return 0;
  } catch (err) {
    if (err instanceof ApiError) {
      console.error(`API ${err.status} (${err.code}) : ${err.message}`);
    } else {
      console.error(err instanceof Error ? err.message : err);
    }
    return 1;
  } finally {
    await sender.close().catch(() => {});
  }
}

if (import.meta.main) {
  Deno.exit(await main());
}

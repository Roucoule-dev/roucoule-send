import prompts from "npm:prompts@^2.4.2";
import type { RoucouleConfig } from "./types.ts";
import { saveConfig } from "./config.ts";

function onCancel(): never {
  console.error("Configuration annulée.");
  Deno.exit(130);
}

export async function runWizard(): Promise<RoucouleConfig> {
  console.log("\nConfiguration de @roucoule/send.");
  console.log(
    "Tes réponses seront sauvegardées localement (mode 0600).\n",
  );

  const general = await prompts(
    [
      {
        type: "text",
        name: "baseUrl",
        message: "URL Roucoule",
        initial: "https://roucoule.dev",
        format: (v: string) => v.trim().replace(/\/+$/, ""),
        validate: (v: string) =>
          /^https?:\/\//.test(v) ? true : "URL invalide (http(s)://…)",
      },
      {
        type: "password",
        name: "apiToken",
        message: "Token API (rcl_…, crée-le dans /me/tokens)",
        validate: (v: string) =>
          v.startsWith("rcl_") ? true : "Doit commencer par rcl_",
      },
    ],
    { onCancel },
  );

  const smtp = await prompts(
    [
      {
        type: "text",
        name: "host",
        message: "Hôte SMTP (ex: mail.infomaniak.com)",
        validate: (v: string) => v.length > 0 || "Requis",
      },
      {
        type: "number",
        name: "port",
        message: "Port SMTP",
        initial: 465,
        validate: (v: number) =>
          [465, 587].includes(v) || `Avertissement : port ${v} inhabituel`,
      },
      {
        type: "text",
        name: "username",
        message: "Nom d'utilisateur SMTP",
        validate: (v: string) => v.length > 0 || "Requis",
      },
      {
        type: "password",
        name: "password",
        message: "Mot de passe SMTP",
        validate: (v: string) => v.length > 0 || "Requis",
      },
    ],
    { onCancel },
  );

  const config: RoucouleConfig = {
    baseUrl: general.baseUrl,
    apiToken: general.apiToken,
    smtp,
  };
  await saveConfig(config);
  console.log("\n✓ Configuration sauvegardée.");
  return config;
}
